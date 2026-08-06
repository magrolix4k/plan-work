import React, { useState } from 'react';
import { X, Copy, Check, Bot, MessageSquare, Terminal, Globe, Workflow } from 'lucide-react';

const WORKFLOW_STAGES = [
  { id: 'plan', color: '#a855f7', who: 'agent สร้างทันทีที่เข้าใจโจทย์ ก่อนลงมือ' },
  { id: 'in_progress', color: '#f59e0b', who: 'agent ย้ายได้เฉพาะหลังผู้ใช้ตกลง plan แล้ว' },
  { id: 'in_review', color: '#06b6d4', who: 'agent ย้ายเมื่อทำเสร็จ — ไกลสุดที่ agent ทำเองได้' },
  { id: 'done', color: '#10b981', who: 'ผู้ใช้กดเองบนบอร์ดเท่านั้น (API ตอบ 403 ถ้า agent สั่ง)' }
];

export default function AgentGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, sectionKey) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const cliExample = `# List open tasks in a Task Set (DONE is hidden unless you pass --all)
./task-agent.sh list --set="Sprint 1"

# Read one task in full, including its log history
./task-agent.sh show task-101

# 1. Create the task the moment you understand the ask - BEFORE starting work
./task-agent.sh create "Implement auth endpoint" --set="Sprint 1" --status=plan --priority=high

# 2. Only AFTER the human agrees to the plan
./task-agent.sh update task-101 --status=in_progress --progress=30 --log="Starting on JWT validation"

# 3. Work finished -> hand over for review. This is as far as an agent may go.
./task-agent.sh review task-101 --log="All unit tests passed, ready for review"

# 4. DONE is the reviewer's call, on the board. The API rejects it from the CLI.`;

  const curlExample = `# Create task in a specific Task Set
curl -X POST https://plan-work-nu.vercel.app/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Refactor API","taskSet":"Sprint 1","status":"plan","assignee":"Antigravity AI"}'

# Update task status to In Progress
curl -X PATCH https://plan-work-nu.vercel.app/api/tasks/task-101 \\
  -H "Content-Type: application/json" \\
  -d '{"status":"in_progress","progress":50,"logNote":"Started writing code","author":"Antigravity AI"}'

# Automated clients should send this header, which makes status:"done" return 403
#   -H "x-agent-client: my-agent"`;

  const aiPromptSnippet = `คำสั่งเพิ่มเติมสำหรับ AI Agent:
เมื่อทำงานในโปรเจกต์นี้ ให้อัพเดทสถานะงานใน Task Tracker ผ่าน CLI เสมอ และห้ามข้ามขั้น:

1. สร้างงาน (ทันทีที่เข้าใจโจทย์ ก่อนลงมือ):
   ./task-agent.sh create "<ชื่อ Task>" --set="Sprint 1" --status=plan
2. เริ่มทำ (เฉพาะหลังจากที่ผู้ใช้ตกลง plan แล้วเท่านั้น):
   ./task-agent.sh update <task-id> --status=in_progress --progress=30 --log="กำลังเริ่ม..."
3. ทำเสร็จ ส่งให้ review (ไกลสุดที่ agent ย้ายเองได้):
   ./task-agent.sh review <task-id> --log="เสร็จแล้ว รอ review"
4. done = ผู้ใช้เป็นคนกดเองบนบอร์ด — agent ห้ามปิดงานเอง (API จะตอบ 403)

ถ้าไม่รู้ว่างานอยู่ Set ไหน ให้ถามก่อน อย่าเดา`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bot size={22} color="var(--accent-cyan)" />
            <h2 className="modal-title">AI Agent Integration Cheat Sheet</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            ใช้คำสั่งด้านล่างนี้เพื่อให้ **AI Agent (เช่น Antigravity, Cursor, Claude CLI)** หรือ Script อัพเดทสถานะงานเข้าสู่ Web UI แบบ Real-time ได้ทันที:
          </p>

          <div className="guide-drawer">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
              <Workflow size={16} /> Workflow — ห้ามข้ามขั้น
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', margin: '0.5rem 0 0.75rem' }}>
              {WORKFLOW_STAGES.map((stage, i) => (
                <React.Fragment key={stage.id}>
                  <span
                    title={stage.who}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      color: stage.color,
                      border: `1px solid ${stage.color}`,
                      background: `${stage.color}1a`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {stage.id}
                  </span>
                  {i < WORKFLOW_STAGES.length - 1 && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.1rem', margin: 0 }}>
              {WORKFLOW_STAGES.map(stage => (
                <li key={stage.id}>
                  <strong style={{ color: stage.color }}>{stage.id}</strong> — {stage.who}
                </li>
              ))}
            </ul>
          </div>

          <div className="guide-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-purple)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <MessageSquare size={16} /> Prompt Template (คัดลอกไปแปะตอนสั่งงาน AI)
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => copyToClipboard(aiPromptSnippet, 'prompt')}
              >
                {copiedSection === 'prompt' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedSection === 'prompt' ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>
            <pre className="code-block" style={{ color: '#e2e8f0' }}>{aiPromptSnippet}</pre>
          </div>

          <div className="guide-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Terminal size={16} /> Task CLI Tool Commands (`./task-agent.sh`)
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => copyToClipboard(cliExample, 'cli')}
              >
                {copiedSection === 'cli' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedSection === 'cli' ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="code-block">{cliExample}</pre>
          </div>

          <div className="guide-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Globe size={16} /> REST API & cURL Integration
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                onClick={() => copyToClipboard(curlExample, 'curl')}
              >
                {copiedSection === 'curl' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedSection === 'curl' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="code-block">{curlExample}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
