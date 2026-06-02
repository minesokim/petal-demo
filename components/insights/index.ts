// Petal Insights - AI Intelligence Layer Components
// These components power the ambient AI commentary throughout Petal

export { PetalInsightCard, CompactInsight } from "./petal-insight"
export { DraftMessageCard, InlineDraftPreview } from "./draft-message"
export { ActivityTimeline, DetailedActivityTimeline } from "./activity-timeline"
export {
  TrackingBadge,
  TrackingBadgeGroup,
  AttentionChip,
  buildAttentionItems,
  generateClientTrackingBadges,
} from "./tracking-badge"
export type { AttentionItem } from "./tracking-badge"
export {
  MorningBriefing,
  CompactBriefingCard,
  SeasonProgress,
} from "./morning-briefing"
export {
  InlineInsight,
  CompactInsightIndicator,
  InsightDot,
} from "./inline-insight"
