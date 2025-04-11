import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'bot',
    content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
    timestamp: new Date(),
  },
];

const QUICK_RESPONSES = [
  '¿Cómo crear un nuevo contrato?',
  '¿Cómo funciona el cálculo de nómina?',
  '¿Cuáles son mis derechos laborales?',
  '¿Cómo manejar pagos atrasados?',
];

const SIMULATED_RESPONSES: Record<string, string> = {
  '¿cómo crear un nuevo contrato?': 'Para crear un nuevo contrato, ve a la sección de Contratos y haz clic en "Nuevo Contrato". Completa los campos requeridos y guarda.',
  '¿cómo funciona el cálculo de nómina?': 'El cálculo de nómina incluye salario base, horas extras, deducciones de impuestos y seguridad social. Revisa la sección de Pagos para más detalles.',
  '¿cuáles son mis derechos laborales?': 'Tus derechos incluyen salario mínimo, jornada máxima, descansos y vacaciones. Consulta la sección de Educación para más información.',
  '¿cómo manejar pagos atrasados?': 'Para manejar pagos atrasados, contacta al departamento de finanzas y revisa las políticas de pago en la sección de Ayuda.',
};

export function Chatbot() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar mensajes desde localStorage al iniciar
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages, (key, value) =>
        key === 'timestamp' ? new Date(value) : value
      ));
    }
  }, []);

  // Guardar mensajes en localStorage cuando cambien
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll inteligente
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current.parentElement!;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular respuesta
    setTimeout(() => {
      const normalizedContent = content.toLowerCase().trim();
      const response = SIMULATED_RESPONSES[normalizedContent] ||
        'No tengo una respuesta específica para eso. Prueba con una de las preguntas rápidas o consulta la sección de Ayuda.';

      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickResponse = (response: string) => handleSend(response);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Abrir chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl w-80 sm:w-96 transition-all ${isMinimized ? 'h-14' : 'h-[32rem]'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium">Asistente Virtual</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMessages(INITIAL_MESSAGES)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Borrar mensajes"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-500 hover:text-gray-700"
            aria-label={isMinimized ? 'Maximizar chat' : 'Minimizar chat'}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="p-4 h-[calc(32rem-8rem)] overflow-y-auto" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses - Modificado para ser responsive */}
          <div className="px-4 py-2 border-t border-gray-200">
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2 flex-nowrap">
                {QUICK_RESPONSES.map((response, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickResponse(response)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-gray-700 whitespace-nowrap flex-shrink-0"
                  >
                    {response}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input - Versión responsive */}
          <div className="p-2 sm:p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 min-w-0 text-sm sm:text-base px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="flex-shrink-0 bg-blue-600 text-white rounded-lg p-2 sm:px-4 sm:py-2 hover:bg-blue-700 transition-colors"
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}