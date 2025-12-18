import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import * as back4app from '../services/back4appRest';
import { MessageSquare, ChevronRight, Loader } from 'lucide-react';

export const MessagesTab: React.FC = () => {
    const { user } = useUser();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMsg, setNewMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const res = await back4app.getConversations();
            setConversations(res?.results || []);
        } catch (e) {
            console.error('[MessagesTab] Error loading conversations:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (convId: string) => {
        try {
            const res = await back4app.getMessages(convId);
            setMessages(res?.results || []);
        } catch (e) {
            console.error('[MessagesTab] Error loading messages:', e);
        }
    };

    const handleSend = async () => {
        if (!newMsg.trim() || !selectedConv || !user) return;
        const convId = selectedConv.objectId || selectedConv.id;
        console.log('[MessagesTab] Sending message to:', convId);
        try {
            await back4app.sendMessage(convId, newMsg);
            setNewMsg('');
            loadMessages(convId);
        } catch (e) {
            console.error('[MessagesTab] Error sending message:', e);
            alert('Ошибка при отправке сообщения');
        }
    };

    if (loading) return <div className="text-center py-20"><Loader className="animate-spin mx-auto w-8 h-8 text-indigo-600" /></div>;
    if (!user) return <div className="text-center py-20 text-gray-500">Пожалуйста, войдите в аккаунт</div>;

    const currentUserId = user.id || user.objectId;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 overflow-hidden min-h-[500px]">
            {/* Conversations List */}
            <div className={`md:col-span-1 border-r dark:border-slate-700 ${selectedConv ? 'hidden md:block' : 'block'}`}>
                <div className="p-4 border-b dark:border-slate-700 font-bold dark:text-white">Чаты</div>
                <div className="overflow-y-auto h-[400px]">
                    {conversations.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Нет активных чатов</div>}
                    {conversations.map((conv) => {
                        const otherUser = conv.participants.find((p: any) => (p.objectId || p.id) !== currentUserId);
                        return (
                            <button
                                key={conv.objectId || conv.id}
                                onClick={() => { setSelectedConv(conv); loadMessages(conv.objectId || conv.id); }}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-b dark:border-slate-700 text-left ${selectedConv?.objectId === conv.objectId || selectedConv?.id === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                                    {otherUser?.username?.[0]?.toUpperCase() || 'P'}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-sm dark:text-white truncate">{otherUser?.username || 'Служба поддержки'}</div>
                                    <div className="text-xs text-gray-500 truncate">Нажми, чтобы открыть</div>
                                </div>
                                <div className="text-[10px] text-gray-400">
                                    {conv.lastMessageAt ? (new Date(conv.lastMessageAt?.iso || conv.lastMessageAt).toLocaleDateString()) : ''}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat View */}
            <div className={`md:col-span-2 flex flex-col ${!selectedConv ? 'hidden md:flex items-center justify-center bg-slate-50 dark:bg-slate-900/50' : 'flex'}`}>
                {selectedConv ? (
                    <>
                        <div className="p-4 border-b dark:border-slate-700 flex items-center gap-3">
                            <button onClick={() => setSelectedConv(null)} className="md:hidden text-indigo-600">←</button>
                            <div className="font-bold dark:text-white">Чат с {selectedConv.participants.find((p: any) => (p.objectId || p.id) !== currentUserId)?.username || 'Участником'}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[350px]">
                            {messages.map((m) => (
                                <div key={m.objectId || m.id} className={`flex ${(m.sender?.objectId || m.sender?.id) === currentUserId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${(m.sender?.objectId || m.sender?.id) === currentUserId ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-700 dark:text-white rounded-tl-none'}`}>
                                        {m.text}
                                        <div className={`text-[9px] mt-1 opacity-70 ${(m.sender?.objectId || m.sender?.id) === currentUserId ? 'text-right' : 'text-left'}`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Напишите сообщение..."
                                    className="flex-1 p-2 border dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button onClick={handleSend} className="bg-indigo-600 text-white p-2 rounded-lg"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-8">
                        <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-300">Выберите чат</h3>
                        <p className="text-gray-400 text-sm">Здесь будет ваша переписка</p>
                    </div>
                )}
            </div>
        </div>
    );
};
