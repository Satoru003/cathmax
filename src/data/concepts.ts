import { Concept } from "@/lib/types";
import { saintsConcepts } from "./categories/saints";
import { sacramentsConcepts } from "./categories/sacraments";
import { scriptureConcepts } from "./categories/scripture";
import { prayersConcepts } from "./categories/prayers";
import { doctrineConcepts } from "./categories/doctrine";
import { moralityConcepts } from "./categories/morality";
import { churchHistoryConcepts } from "./categories/church-history";
import { maryConcepts } from "./categories/mary";
import { liturgyConcepts } from "./categories/liturgy";
import { virtuesConcepts } from "./categories/virtues";
import { apologeticsConcepts } from "./categories/apologetics";
import { socialTeachingConcepts } from "./categories/social-teaching";
import { traditionConcepts } from "./categories/tradition";
import { devotionsConcepts } from "./categories/devotions";
import { mysticismConcepts } from "./categories/mysticism";
import { summaAquinasConcepts } from "./categories/summa-aquinas";
import { doctrineExtraConcepts } from "./categories/doctrine-extra";
import { saintsExtraConcepts } from "./categories/saints-extra";
import { spiritualityExtraConcepts } from "./categories/spirituality-extra";
import { miscExtraConcepts } from "./categories/misc-extra";

export const concepts: Concept[] = [
  ...saintsConcepts,
  ...sacramentsConcepts,
  ...scriptureConcepts,
  ...prayersConcepts,
  ...doctrineConcepts,
  ...moralityConcepts,
  ...churchHistoryConcepts,
  ...maryConcepts,
  ...liturgyConcepts,
  ...virtuesConcepts,
  ...apologeticsConcepts,
  ...socialTeachingConcepts,
  ...traditionConcepts,
  ...devotionsConcepts,
  ...mysticismConcepts,
  ...summaAquinasConcepts,
  ...doctrineExtraConcepts,
  ...saintsExtraConcepts,
  ...spiritualityExtraConcepts,
  ...miscExtraConcepts,
];
