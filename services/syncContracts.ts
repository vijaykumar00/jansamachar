import type { EngagementStory } from '@/store/engagementStore';

export type SyncEntity = 'saved_story' | 'history_story';
export type SyncOperation = 'upsert' | 'delete';

export interface EngagementSyncRecord {
  entity: SyncEntity;
  operation: SyncOperation;
  localId: string;
  userId?: string;
  story: EngagementStory;
  changedAt: string;
}

export function toSavedStorySyncRecord(story: EngagementStory, operation: SyncOperation = 'upsert'): EngagementSyncRecord {
  return {
    entity: 'saved_story',
    operation,
    localId: story.id,
    story,
    changedAt: story.savedAt || new Date().toISOString(),
  };
}

export function toHistoryStorySyncRecord(story: EngagementStory, operation: SyncOperation = 'upsert'): EngagementSyncRecord {
  return {
    entity: 'history_story',
    operation,
    localId: story.id,
    story,
    changedAt: story.viewedAt || new Date().toISOString(),
  };
}

export function buildEngagementSyncSnapshot(savedItems: EngagementStory[], historyItems: EngagementStory[]): EngagementSyncRecord[] {
  return [
    ...savedItems.map((story) => toSavedStorySyncRecord(story)),
    ...historyItems.map((story) => toHistoryStorySyncRecord(story)),
  ].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}
