import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ContactMessage } from '../../types/database';
import { contactService } from '../../services/contactService';
import { formatDate } from '../../lib/format';
import { Button } from '../../components/ui/Button';

export const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    const data = await contactService.getMessages();
    setMessages(data);
    setIsLoading(false);
  };

  const handleMarkHandled = async (id: string) => {
    await contactService.markHandled(id);
    await loadMessages();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Contact Inquiries Inbox</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Incoming customer queries from website contact form (Staff & Owner)
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 bg-[#111111] rounded border border-neutral-800">
            Inbox is clear. No customer inquiries pending.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">{m.name}</h4>
                    <span className="text-neutral-400">
                      Phone: <strong className="text-white">{m.phone || '—'}</strong> • Email: {m.email || '—'} • {formatDate(m.created_at)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase self-start sm:self-center ${
                    m.status === 'new' ? 'bg-[#E31B23]/20 text-[#FF4D55] border border-[#E31B23]' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {m.status}
                  </span>
                </div>

                <p className="text-neutral-300 leading-relaxed font-sans bg-black/40 p-3 rounded border border-neutral-800/80">
                  {m.message}
                </p>

                <div className="flex items-center justify-between pt-2">
                  {m.phone && (
                    <a
                      href={`https://wa.me/92${m.phone.replace(/^0/, '').replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <span>💬 Reply via WhatsApp</span>
                    </a>
                  )}
                  {m.status === 'new' && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkHandled(m.id)}>
                      Mark as Handled
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
