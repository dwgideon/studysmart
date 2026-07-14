import JSZip from "jszip";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

export type QtiQuestion = {
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
  concept?: string;
};

const QTI_NS = "http://www.imsglobal.org/xsd/imsqti_v2p2";

function safeIdentifier(value: string, fallback: string) {
  const normalized = value.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 80);
  return /^[A-Za-z_]/.test(normalized) ? normalized : `${fallback}_${normalized}`;
}

function itemXml(question: QtiQuestion, index: number) {
  const identifier = `item_${index + 1}`;
  const choices = Object.entries(question.options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({ "@_identifier": safeIdentifier(key, "choice"), "#text": value }));
  const document = {
    assessmentItem: {
      "@_xmlns": QTI_NS,
      "@_identifier": identifier,
      "@_title": question.concept ?? `Question ${index + 1}`,
      "@_adaptive": false,
      "@_timeDependent": false,
      responseDeclaration: {
        "@_identifier": "RESPONSE",
        "@_cardinality": "single",
        "@_baseType": "identifier",
        correctResponse: { value: safeIdentifier(question.answer, "choice") },
      },
      outcomeDeclaration: {
        "@_identifier": "SCORE",
        "@_cardinality": "single",
        "@_baseType": "float",
      },
      itemBody: {
        choiceInteraction: {
          "@_responseIdentifier": "RESPONSE",
          "@_shuffle": false,
          "@_maxChoices": 1,
          prompt: question.question,
          simpleChoice: choices,
        },
      },
      responseProcessing: {
        "@_template": "http://www.imsglobal.org/question/qti_v2p2/rptemplates/match_correct",
      },
    },
  };
  return new XMLBuilder({ ignoreAttributes: false, format: true }).build(document);
}

export async function buildQtiPackage(input: {
  identifier: string;
  title: string;
  questions: QtiQuestion[];
}) {
  const zip = new JSZip();
  const resourceEntries = input.questions.map((question, index) => {
    const fileName = `items/item_${index + 1}.xml`;
    zip.file(fileName, itemXml(question, index));
    return {
      "@_identifier": `resource_item_${index + 1}`,
      "@_type": "imsqti_item_xmlv2p2",
      "@_href": fileName,
      file: { "@_href": fileName },
    };
  });
  const manifest = {
    manifest: {
      "@_xmlns": "http://www.imsglobal.org/xsd/imscp_v1p1",
      "@_identifier": safeIdentifier(input.identifier, "assessment"),
      metadata: {
        schema: "IMS Content",
        schemaversion: "1.2.0",
        title: input.title,
      },
      organizations: {},
      resources: { resource: resourceEntries },
    },
  };
  zip.file(
    "imsmanifest.xml",
    new XMLBuilder({ ignoreAttributes: false, format: true }).build(manifest)
  );
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {return String(value);}
  if (value && typeof value === "object" && "#text" in value) {
    return textValue((value as { "#text": unknown })["#text"]);
  }
  return "";
}

export async function parseQtiPackage(buffer: Buffer): Promise<QtiQuestion[]> {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  const files = Object.values(zip.files).filter((file) =>
    !file.dir && /(^|\/)item[^/]*\.xml$/i.test(file.name)
  );
  const parser = new XMLParser({ ignoreAttributes: false, processEntities: false });
  const questions: QtiQuestion[] = [];
  for (const file of files.slice(0, 200)) {
    const xml = await file.async("string");
    const item = parser.parse(xml)?.assessmentItem;
    const interaction = item?.itemBody?.choiceInteraction;
    const prompt = textValue(interaction?.prompt);
    const rawChoices = Array.isArray(interaction?.simpleChoice)
      ? interaction.simpleChoice
      : interaction?.simpleChoice ? [interaction.simpleChoice] : [];
    const options = Object.fromEntries(rawChoices
      .map((choice: Record<string, unknown>) => [
        String(choice["@_identifier"] ?? ""),
        textValue(choice),
      ] as const)
      .filter((entry: readonly [string, string]) => Boolean(entry[0] && entry[1])));
    const answer = textValue(item?.responseDeclaration?.correctResponse?.value);
    if (prompt && Object.keys(options).length >= 2 && answer && options[answer]) {
      questions.push({
        question: prompt,
        options,
        answer,
        concept: typeof item?.["@_title"] === "string" ? item["@_title"] : undefined,
      });
    }
  }
  return questions;
}
