/**
 * BIS Entity List Auto-Updater
 * Automatically refreshes the BIS entity list on a weekly schedule
 * Monitors Federal Register for new additions and updates
 */

import { getBISRealScraper } from './bis-real-scraper';
import { getBISScraper } from './bis-scraper-service';
import type { BISEntityFull } from './bis-scraper-service';

export interface UpdateSchedule {
  enabled: boolean;
  intervalDays: number;
  lastUpdate: Date | null;
  nextUpdate: Date | null;
  autoStart: boolean;
}

export interface UpdateResult {
  success: boolean;
  timestamp: Date;
  entitiesCount: number;
  newEntities: number;
  removedEntities: number;
  modifiedEntities: number;
  errors: string[];
}

export class BISAutoUpdater {
  private schedule: UpdateSchedule;
  private updateTimer: NodeJS.Timeout | null = null;
  private isUpdating: boolean = false;
  private updateHistory: UpdateResult[] = [];

  constructor(config?: Partial<UpdateSchedule>) {
    this.schedule = {
      enabled: true,
      intervalDays: 7, // Weekly updates
      lastUpdate: null,
      nextUpdate: null,
      autoStart: true,
      ...config
    };

    if (this.schedule.autoStart) {
      this.start();
    }
  }

  /**
   * Start the auto-update scheduler
   */
  public start() {
    if (this.updateTimer) {
      console.log('⚠️  Auto-updater already running');
      return;
    }

    this.schedule.enabled = true;
    console.log(`✅ BIS auto-updater started (refresh every ${this.schedule.intervalDays} days)`);

    // Run initial update
    this.runUpdate();

    // Schedule periodic updates
    const intervalMs = this.schedule.intervalDays * 24 * 60 * 60 * 1000;
    this.updateTimer = setInterval(() => {
      this.runUpdate();
    }, intervalMs);

    // Calculate next update time
    this.schedule.nextUpdate = new Date(Date.now() + intervalMs);
  }

  /**
   * Stop the auto-updater
   */
  public stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      this.schedule.enabled = false;
      console.log('🛑 BIS auto-updater stopped');
    }
  }

  /**
   * Force an immediate update (bypasses schedule)
   */
  public async forceUpdate(): Promise<UpdateResult> {
    console.log('🔄 Forcing immediate BIS entity list update...');
    return await this.runUpdate();
  }

  /**
   * Run the update process
   */
  private async runUpdate(): Promise<UpdateResult> {
    if (this.isUpdating) {
      console.log('⚠️  Update already in progress, skipping...');
      return this.createErrorResult('Update already in progress');
    }

    this.isUpdating = true;
    const startTime = Date.now();

    try {
      console.log('📡 Starting BIS entity list update...');

      // Get current list for comparison
      const bisScraper = getBISScraper();
      const currentList = bisScraper.getCurrentList();

      // Fetch fresh list from REAL scraper (calls official API)
      const realScraper = getBISRealScraper();
      const freshList = await realScraper.forceRefresh();

      // Compare and detect changes
      const changes = this.detectChanges(currentList, freshList);

      // Create update result
      const result: UpdateResult = {
        success: true,
        timestamp: new Date(),
        entitiesCount: freshList.length,
        newEntities: changes.added.length,
        removedEntities: changes.removed.length,
        modifiedEntities: changes.modified.length,
        errors: []
      };

      // Update schedule
      this.schedule.lastUpdate = new Date();
      this.schedule.nextUpdate = new Date(
        Date.now() + this.schedule.intervalDays * 24 * 60 * 60 * 1000
      );

      // Store in history
      this.updateHistory.push(result);
      if (this.updateHistory.length > 50) {
        this.updateHistory.shift(); // Keep last 50 updates
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✅ BIS update complete in ${duration}s:`);
      console.log(`   📊 Total entities: ${result.entitiesCount}`);
      console.log(`   ➕ New: ${result.newEntities}`);
      console.log(`   ➖ Removed: ${result.removedEntities}`);
      console.log(`   ✏️  Modified: ${result.modifiedEntities}`);
      console.log(`   ⏰ Next update: ${this.schedule.nextUpdate?.toISOString()}`);

      // Log significant changes
      if (changes.added.length > 0) {
        console.log('\n📢 NEW ENTITIES ADDED:');
        changes.added.slice(0, 5).forEach(entity => {
          console.log(`   • ${entity.name} (${entity.country})`);
        });
        if (changes.added.length > 5) {
          console.log(`   ... and ${changes.added.length - 5} more`);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ BIS update failed:', error);
      const result = this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.updateHistory.push(result);
      return result;

    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Detect changes between old and new lists
   */
  private detectChanges(
    oldList: BISEntityFull[],
    newList: BISEntityFull[]
  ): {
    added: BISEntityFull[];
    removed: BISEntityFull[];
    modified: BISEntityFull[];
  } {
    const oldNames = new Set(oldList.map(e => this.normalizeEntityName(e.name)));
    const newNames = new Set(newList.map(e => this.normalizeEntityName(e.name)));

    // Find added entities
    const added = newList.filter(entity => {
      const normalized = this.normalizeEntityName(entity.name);
      return !oldNames.has(normalized);
    });

    // Find removed entities
    const removed = oldList.filter(entity => {
      const normalized = this.normalizeEntityName(entity.name);
      return !newNames.has(normalized);
    });

    // Find modified entities (same name but different data)
    const modified = newList.filter(newEntity => {
      const normalized = this.normalizeEntityName(newEntity.name);
      if (!oldNames.has(normalized)) return false;

      const oldEntity = oldList.find(e =>
        this.normalizeEntityName(e.name) === normalized
      );

      return oldEntity && this.hasEntityChanged(oldEntity, newEntity);
    });

    return { added, removed, modified };
  }

  /**
   * Check if entity data has changed
   */
  private hasEntityChanged(old: BISEntityFull, newEntity: BISEntityFull): boolean {
    return (
      old.effectiveDate !== newEntity.effectiveDate ||
      old.federalRegisterCitation !== newEntity.federalRegisterCitation ||
      old.listingReason !== newEntity.listingReason ||
      old.licenseReviewPolicy !== newEntity.licenseReviewPolicy
    );
  }

  /**
   * Normalize entity name for comparison
   */
  private normalizeEntityName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[,\.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Create error result
   */
  private createErrorResult(errorMessage: string): UpdateResult {
    return {
      success: false,
      timestamp: new Date(),
      entitiesCount: 0,
      newEntities: 0,
      removedEntities: 0,
      modifiedEntities: 0,
      errors: [errorMessage]
    };
  }

  /**
   * Get update status
   */
  public getStatus(): {
    enabled: boolean;
    isUpdating: boolean;
    lastUpdate: Date | null;
    nextUpdate: Date | null;
    intervalDays: number;
    recentHistory: UpdateResult[];
  } {
    return {
      enabled: this.schedule.enabled,
      isUpdating: this.isUpdating,
      lastUpdate: this.schedule.lastUpdate,
      nextUpdate: this.schedule.nextUpdate,
      intervalDays: this.schedule.intervalDays,
      recentHistory: this.updateHistory.slice(-10) // Last 10 updates
    };
  }

  /**
   * Get update history
   */
  public getHistory(limit: number = 10): UpdateResult[] {
    return this.updateHistory.slice(-limit);
  }

  /**
   * Set update interval (in days)
   */
  public setInterval(days: number) {
    this.schedule.intervalDays = days;
    console.log(`⚙️  Update interval set to ${days} days`);

    // Restart with new interval
    if (this.schedule.enabled) {
      this.stop();
      this.start();
    }
  }
}

// Singleton instance
let autoUpdaterInstance: BISAutoUpdater | null = null;

export function getBISAutoUpdater(config?: Partial<UpdateSchedule>): BISAutoUpdater {
  if (!autoUpdaterInstance) {
    autoUpdaterInstance = new BISAutoUpdater(config);
  }
  return autoUpdaterInstance;
}

// Start auto-updater on module load (in production)
if (process.env.NODE_ENV === 'production') {
  getBISAutoUpdater({ autoStart: true, intervalDays: 7 });
}

export default BISAutoUpdater;
