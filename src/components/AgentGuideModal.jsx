import React, { useState } from 'react';
import { X, Copy, Check, Bot } from 'lucide-react';

export default function AgentGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, sectionKey) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const cliExample = `./task-agent.sh list
./task-agent.sh create "Implement auth endpoint" --status=plan --priority=high
./task-agent.sh update task-101 --status=in_progress --progress=50 --log="Drafted JWT validation"
./task-agent.sh complete task-101 --log="All unit tests passed"`;

  const curlExample = `# Update task status to In Progress
curl -X PATCH http://localhost:3001/api/tasks/task-101 \\
  -H "Content-Type: application/json" \\
  -d '{"status":"in_progress","progress":50,"logNote":"Started writing code","author":"Antigravity AI"}'

# Mark task as DONE
curl -X PATCH http://localhost:3001/api/tasks/task-101 \\
  -H "Content-Type: application/json" \\
  -d '{"status":"done","progress":100,"logNote":"Task finished successfully"}'`;

  const aiPromptSnippet = `คำสั่งเพิ่มเติมสำหรับ AI Agent:
เมื่อทำงานใดๆ ในโปรเจกต์นี้ ให้สั่งอัพเดทสถานะงานใน Task Tracker ผ่าน CLI command นี้เสมอ:
- เริ่มทำ: ./task-agent.sh update <task-id> --status=in_progress --progress=30 --log="กำลังเริ่ม..."
- ทำเสร็จ: ./task-agent.sh complete <task-id> --log="สร้างไฟล์เรียบร้อยแล้ว"`;

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

          {/* Section 1: Prompt Snippet */}
          <div className="guide-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                💬 Prompt Template (คัดลอกไปแปะตอนสั่งงาน AI)
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

          {/* Section 2: CLI Commands */}
          <div className="guide-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                💻 Task CLI Tool Commands (`./task-agent.sh`)
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

          {/* Section 3: REST API */}
          <div className="guide-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                🌐 REST API & cURL Integration
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
