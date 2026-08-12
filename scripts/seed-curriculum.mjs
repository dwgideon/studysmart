import { syncPilotCurriculum } from "../src/lib/curriculumRepository.ts";

const result = await syncPilotCurriculum();
console.log(`Synced ${result.units} pilot units and ${result.lessons} published lessons.`);
