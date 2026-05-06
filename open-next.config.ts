import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache'
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue'

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: doShardedTagCache({ baseShardSize: 2 }),
  queue: doQueue,
})
