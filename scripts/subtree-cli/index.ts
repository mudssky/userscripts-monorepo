import { Command } from 'commander'
import { createPullCommand } from './commands/pull.js'
import { createPushCommand } from './commands/push.js'
import { createAddCommand } from './commands/add.js'
import { createListCommand } from './commands/list.js'
import { createStatusCommand } from './commands/status.js'

const program = new Command()

program
  .name('subtree')
  .description('管理 monorepo 中的 git subtree 仓库')
  .version('1.0.0')
  .addCommand(createPullCommand())
  .addCommand(createPushCommand())
  .addCommand(createAddCommand())
  .addCommand(createListCommand())
  .addCommand(createStatusCommand())

program.parse()
