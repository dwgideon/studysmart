import type { NextApiRequest, NextApiResponse } from "next";
import { databaseTransaction } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { catalogItem, STARTER_ITEMS } from "@/lib/gameEconomy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {return res.status(405).end();}
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  const item = catalogItem(String(req.body?.itemId || ""));
  if (!item) {return res.status(404).json({ error: "That avatar item is unavailable." });}

  try {
    const result = await databaseTransaction(async (tx) => {
      const profile = await tx.gameProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
      const isStarter = STARTER_ITEMS.includes(item.id);
      const ownership = isStarter ? true : Boolean(await tx.avatarItemOwnership.findUnique({ where: { userId_itemId: { userId: user.id, itemId: item.id } } }));

      if (req.body.action === "buy") {
        if (ownership) {return { sparks: profile.sparks, owned: true, equipped: false };}
        if (profile.sparks < item.price) {throw new Error("NOT_ENOUGH_SPARKS");}
        const updated = await tx.gameProfile.update({ where: { userId: user.id }, data: { sparks: { decrement: item.price } } });
        await tx.avatarItemOwnership.create({ data: { userId: user.id, itemId: item.id } });
        return { sparks: updated.sparks, owned: true, equipped: false };
      }
      if (req.body.action === "equip") {
        if (!ownership) {throw new Error("NOT_OWNED");}
        const field = item.slot === "hair" ? "equippedHair" : item.slot === "top" ? "equippedTop" : "equippedExtra";
        await tx.gameProfile.update({ where: { userId: user.id }, data: { [field]: item.id } });
        return { sparks: profile.sparks, owned: true, equipped: true, slot: item.slot, itemId: item.id };
      }
      throw new Error("BAD_ACTION");
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_ENOUGH_SPARKS") {return res.status(400).json({ error: "Earn more Sparks by answering study questions." });}
    return res.status(400).json({ error: "That avatar update could not be completed." });
  }
}
