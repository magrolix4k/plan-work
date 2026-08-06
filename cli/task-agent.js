#!/usr/bin/env node

/**
 * Task Tracker CLI Helper for AI Agents & Terminal Users
 * Usage:
 *   node cli/task-agent.js list --set=PLX
 *   node cli/task-agent.js show task-101
 *   node cli/task-agent.js create "Task Title" --status=plan --priority=high --set=PLX
 *   node cli/task-agent.js update task-101 --status=in_progress --progress=50 --log="Writing unit tests"
 *   node cli/task-agent.js review task-101 --log="Ready for review"
 *   node cli/task-agent.js log task-101 --note="Added API endpoint documentation"
 *
 * The workflow is plan -> in_progress -> in_review -> done. Only a human moves a
 * task to `done`, on the board; the API rejects it from this CLI.
 */

import http from 'http';
import https from 'https';

const DEFAULT_API = 'https://plan-work-nu.vercel.app/api';
const API_BASE = process.env.TASK_API_URL || DEFAULT_API;
const AGENT_NAME = process.env.TASK_AGENT_NAME || 'Claude Code';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-agent-client': 'task-agent-cli'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`API Error: ${err.message}. Make sure API is accessible at ${API_BASE}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function parseArgs(args) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (value !== undefined) {
        flags[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const { flags, positional } = parseArgs(args.slice(1));

  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  try {
    switch (command.toLowerCase()) {
      case 'list': {
        const res = await request('GET', '/tasks');
        let tasks = res.body.tasks || [];
        const total = tasks.length;

        if (flags.status) {
          tasks = tasks.filter(t => t.status.toLowerCase() === flags.status.toLowerCase());
        } else if (!flags.all) {
          tasks = tasks.filter(t => t.status.toLowerCase() !== 'done');
        }
        if (flags.set || flags.taskSet) {
          const targetSet = (flags.set || flags.taskSet).toLowerCase();
          tasks = tasks.filter(t => (t.task_set || t.taskSet || 'Default').toLowerCase() === targetSet);
        }

        const matched = tasks.length;
        const limit = flags.limit ? parseInt(flags.limit) : 20;
        if (matched > limit) tasks = tasks.slice(0, limit);

        console.log(`\n[TASKS LIST] showing ${tasks.length} of ${matched} matched (${total} total)`);
        if (!flags.status && !flags.all) console.log('hiding DONE — pass --all to include them');
        if (matched > tasks.length) console.log(`truncated at --limit=${limit}`);
        console.log('-'.repeat(60));
        tasks.forEach(t => {
          const statusTag = `[${t.status.toUpperCase()}]`;
          const setTag = t.task_set && t.task_set !== 'Default' ? ` [SET: ${t.task_set}]` : '';
          console.log(`${statusTag}${setTag} [${t.id}] ${t.title}`);
          console.log(`   Assignee: ${t.assignee || 'Unassigned'} | Progress: ${t.progress}% | Priority: ${t.priority.toUpperCase()}`);
          if (t.tags && t.tags.length) console.log(`   Tags: ${t.tags.join(', ')}`);
          console.log('-'.repeat(60));
        });
        break;
      }

      case 'show': {
        const id = positional[0] || flags.id;
        if (!id) {
          console.error('[ERROR] Task ID is required.');
          process.exit(1);
        }
        const res = await request('GET', `/tasks/${id}`);
        if (res.status !== 200 || !res.body.task) {
          console.error(`[ERROR] Task [${id}] not found.`);
          process.exit(1);
        }
        const t = res.body.task;
        console.log(`\n[${t.status.toUpperCase()}] [${t.id}] ${t.title}`);
        console.log('-'.repeat(60));
        console.log(`Set:      ${t.task_set || t.taskSet || 'Default'}`);
        console.log(`Assignee: ${t.assignee || 'Unassigned'} | Progress: ${t.progress}% | Priority: ${t.priority.toUpperCase()}`);
        if (t.tags && t.tags.length) console.log(`Tags:     ${t.tags.join(', ')}`);
        if (t.description) console.log(`\nDescription:\n${t.description}`);

        const logs = t.logs || t.task_logs || [];
        console.log(`\nLogs (${logs.length}):`);
        console.log('-'.repeat(60));
        logs.forEach(l => {
          const when = l.created_at || l.timestamp || '';
          console.log(`- [${when}] ${l.author || 'Unknown'}: ${l.note}`);
        });
        break;
      }

      case 'create': {
        const title = positional[0] || flags.title;
        if (!title) {
          console.error('[ERROR] Task title is required.');
          process.exit(1);
        }
        const payload = {
          title,
          description: flags.description || flags.desc || '',
          status: flags.status || 'plan',
          priority: flags.priority || 'medium',
          assignee: flags.assignee || AGENT_NAME,
          taskSet: flags.set || flags.taskSet || flags.task_set || 'Default',
          tags: flags.tags || '',
          progress: flags.progress ? parseInt(flags.progress) : 0,
          logNote: flags.log || flags.note || 'Task created via CLI'
        };
        const res = await request('POST', '/tasks', payload);
        console.log(`[SUCCESS] Created Task [${res.body.task.id}]: "${res.body.task.title}" (Set: ${res.body.task.task_set || res.body.task.taskSet || 'Default'} | Status: ${res.body.task.status.toUpperCase()})`);
        break;
      }

      case 'update': {
        const id = positional[0] || flags.id;
        if (!id) {
          console.error('[ERROR] Task ID is required.');
          process.exit(1);
        }
        const updates = {
          author: flags.author || flags.assignee || AGENT_NAME
        };
        if (flags.status) updates.status = flags.status;
        if (flags.progress !== undefined) updates.progress = parseInt(flags.progress);
        if (flags.title) updates.title = flags.title;
        if (flags.description || flags.desc) updates.description = flags.description || flags.desc;
        if (flags.priority) updates.priority = flags.priority;
        if (flags.assignee) updates.assignee = flags.assignee;
        if (flags.tags) updates.tags = flags.tags;
        if (flags.log || flags.note) updates.logNote = flags.log || flags.note;

        const res = await request('PATCH', `/tasks/${id}`, updates);
        if (res.status === 200) {
          console.log(`[SUCCESS] Updated Task [${id}]: Status = ${res.body.task.status.toUpperCase()} | Progress = ${res.body.task.progress}%`);
        } else {
          console.error(`[ERROR] Update Failed:`, res.body);
        }
        break;
      }

      case 'review': {
        const id = positional[0] || flags.id;
        if (!id) {
          console.error('[ERROR] Task ID is required.');
          process.exit(1);
        }
        const updates = {
          status: 'in_review',
          progress: flags.progress !== undefined ? parseInt(flags.progress) : 100,
          logNote: flags.log || flags.note || 'Work finished, handing over for review',
          author: flags.author || AGENT_NAME
        };
        const res = await request('PATCH', `/tasks/${id}`, updates);
        if (res.status === 200) {
          console.log(`[IN_REVIEW] Task [${id}]: "${res.body.task.title}" is ready for review.`);
          console.log('Waiting for a human to move it to DONE on the board.');
        } else {
          console.error(`[ERROR] Handover Failed:`, res.body);
        }
        break;
      }

      case 'complete':
      case 'done': {
        console.error('[BLOCKED] Agents do not close tasks.');
        console.error('Use: task-agent.sh review <id> --log="..."  then let the reviewer mark it DONE on the board.');
        process.exit(1);
        break;
      }

      case 'log': {
        const id = positional[0] || flags.id;
        const note = flags.note || flags.log || positional[1];
        if (!id || !note) {
          console.error('[ERROR] Task ID and --note are required.');
          process.exit(1);
        }
        const res = await request('POST', `/tasks/${id}/logs`, {
          author: flags.author || AGENT_NAME,
          note
        });
        if (res.status === 200) {
          console.log(`[LOG] Added to Task [${id}]: "${note}"`);
        } else {
          console.error(`[ERROR] Log Addition Failed:`, res.body);
        }
        break;
      }

      default:
        console.log(`Unknown command: ${command}`);
        printHelp();
    }
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Task Agent CLI - Helper tool for AI Agents & Terminal Users

Workflow (never skip a stage):
  plan  ->  in_progress  ->  in_review  ->  done
   ^          ^                 ^            ^
   |          |                 |            +-- HUMAN ONLY, on the board
   |          |                 +-- agent, once the work is finished
   |          +-- agent, only AFTER the human agrees to the plan
   +-- agent, as soon as the task is understood (before starting)

Statuses: backlog | plan | in_progress | in_review | done

Commands:
  list    [--status=...] [--set=NAME] [--limit=N] [--all]   List tasks (hides DONE unless --all)
  show    <id>                                              Full detail + log history of one task
  create  <title> [--status=...] [--priority=...] [--set=NAME] [--assignee=...] [--log=...]
  update  <id> [--status=...] [--progress=0-100] [--log=...]
  review  <id> [--log="..."]                                Hand over for review (-> in_review)
  log     <id> --note="..."                                 Add a progress log note to a task

Notes:
  - Agents cannot set status=done; the API rejects it. Use 'review' and let the reviewer close it.
  - --set is required whenever the work belongs to a Task Set; ask which set rather than guessing.
  - Agent name defaults to "${AGENT_NAME}" (override with TASK_AGENT_NAME).

Examples:
  node cli/task-agent.js list --set=PLX
  node cli/task-agent.js show task-101
  node cli/task-agent.js create "Refactor API routing" --status=plan --priority=high --set=PLX
  node cli/task-agent.js update task-101 --status=in_progress --progress=40 --log="Writing middleware"
  node cli/task-agent.js review task-101 --log="Tests passed, ready for review"
`);
}

main();
