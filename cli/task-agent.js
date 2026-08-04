#!/usr/bin/env node

/**
 * Task Tracker CLI Helper for AI Agents & Terminal Users
 * Usage:
 *   node cli/task-agent.js list
 *   node cli/task-agent.js create "Task Title" --status=plan --priority=high --assignee="Antigravity AI"
 *   node cli/task-agent.js update task-101 --status=in_progress --progress=50 --log="Writing unit tests"
 *   node cli/task-agent.js complete task-101 --log="Completed successfully"
 *   node cli/task-agent.js log task-101 --note="Added API endpoint documentation"
 */

import http from 'http';
import https from 'https';

const DEFAULT_API = 'https://plan-work-nu.vercel.app/api';
const API_BASE = process.env.TASK_API_URL || DEFAULT_API;

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
        'Content-Type': 'application/json'
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
        if (flags.status) {
          tasks = tasks.filter(t => t.status.toLowerCase() === flags.status.toLowerCase());
        }
        console.log(`\n[TASKS LIST] (${tasks.length}):\n` + '-'.repeat(60));
        tasks.forEach(t => {
          const statusTag = `[${t.status.toUpperCase()}]`;
          console.log(`${statusTag} [${t.id}] ${t.title}`);
          console.log(`   Assignee: ${t.assignee || 'Unassigned'} | Progress: ${t.progress}% | Priority: ${t.priority.toUpperCase()}`);
          if (t.tags && t.tags.length) console.log(`   Tags: ${t.tags.join(', ')}`);
          console.log('-'.repeat(60));
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
          assignee: flags.assignee || 'Antigravity AI',
          tags: flags.tags || '',
          progress: flags.progress ? parseInt(flags.progress) : 0,
          logNote: flags.log || flags.note || 'Task created via CLI'
        };
        const res = await request('POST', '/tasks', payload);
        console.log(`[SUCCESS] Created Task [${res.body.task.id}]: "${res.body.task.title}" (Status: ${res.body.task.status.toUpperCase()})`);
        break;
      }

      case 'update': {
        const id = positional[0] || flags.id;
        if (!id) {
          console.error('[ERROR] Task ID is required.');
          process.exit(1);
        }
        const updates = {
          author: flags.author || flags.assignee || 'AI Agent'
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

      case 'complete': {
        const id = positional[0] || flags.id;
        if (!id) {
          console.error('[ERROR] Task ID is required.');
          process.exit(1);
        }
        const updates = {
          status: 'done',
          progress: 100,
          logNote: flags.log || flags.note || 'Task completed successfully',
          author: flags.author || 'AI Agent'
        };
        const res = await request('PATCH', `/tasks/${id}`, updates);
        if (res.status === 200) {
          console.log(`[DONE] Task Completed [${id}]: "${res.body.task.title}" -> DONE (100%)`);
        } else {
          console.error(`[ERROR] Completion Failed:`, res.body);
        }
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
          author: flags.author || 'AI Agent',
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

Commands:
  list    [--status=plan|in_progress|done]      List tasks
  create  <title> [--status=...] [--priority=...] [--assignee=...] [--log=...]
  update  <id> [--status=...] [--progress=0-100] [--log=...]
  complete <id> [--log=...]                      Mark task as DONE (100%)
  log     <id> --note="..."                     Add a progress log note to a task

Examples:
  node cli/task-agent.js list
  node cli/task-agent.js create "Refactor API routing" --status=plan --priority=high --assignee="Antigravity AI"
  node cli/task-agent.js update task-101 --status=in_progress --progress=40 --log="Writing middleware"
  node cli/task-agent.js complete task-101 --log="Tests passed 100%"
`);
}

main();
