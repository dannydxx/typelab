import { DimensionScale } from "@/components/dimension-scale";
import type { RelationshipPositionDefinition } from "@/lib/types";

export function RelationshipSlider({ definition, score }: { definition: RelationshipPositionDefinition; score: number }) {
  return <div className="relationship-slider">
    <DimensionScale title={definition.label} en={definition.en} left={definition.left} right={definition.right} score={score} />
    <p>{definition.interpretation}</p>
  </div>;
}
