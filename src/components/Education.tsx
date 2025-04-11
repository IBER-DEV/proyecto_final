import React, { useState, useEffect } from 'react';
import { Book, Filter, Search, GraduationCap, Scale, Calculator, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { EducationalResource } from '../types';

const MOCK_RESOURCES: EducationalResource[] = [
  {
    id: '1',
    title: 'Formalización Laboral en Colombia: Beneficios, Proceso y Sanciones 🚀⚖️',
    description: 'Sabes qué es la formalización laboral en Colombia y por qué es tan importante? En este video el minesterio de trabajo te lo explica.',
    category: 'financial',
    video_url: 'https://www.youtube.com/embed/wHjRxRZ3GyU', // Normalizacion Laboral
    video_credit: 'Creado por: MinTrabajoColombia',
    difficulty: 'beginner',
    estimated_time: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Derechos Laborales Básicos',
    description: 'Conoce tus derechos fundamentales como trabajador.',
    category: 'legal',
    video_url: 'https://www.youtube.com/embed/V511rTZqLiE', // Derechos Laborales Básicos
    video_credit: 'Creado por: MinTrabajoColombia',
    difficulty: 'beginner',
    estimated_time: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Planificación Financiera',
    description: 'Aprende a manejar tus finanzas personales efectivamente de la mano de sergi torrens.',
    category: 'financial',
    video_url: 'https://www.youtube.com/embed/oaAIZiza3Gc', // Planificación Financiera
    video_credit: 'Creado por: Sergi Torrens',
    difficulty: 'intermediate',
    estimated_time: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function ResourceCard({ resource }: { resource: EducationalResource }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <Calculator className="h-5 w-5" />;
      case 'legal':
        return <Scale className="h-5 w-5" />;
      case 'tax':
        return <Calculator className="h-5 w-5" />;
      case 'rights':
        return <Shield className="h-5 w-5" />;
      default:
        return <Book className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getCategoryIcon(resource.category)}
            <span className="ml-2 text-sm font-medium text-gray-500 capitalize">
              {resource.category}
            </span>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              resource.difficulty === 'beginner'
                ? 'bg-green-100 text-green-800'
                : resource.difficulty === 'intermediate'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {resource.difficulty}
          </span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{resource.title}</h3>
        <p className="mt-2 text-sm text-gray-600">{resource.description}</p>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <GraduationCap className="h-4 w-4 mr-1" />
          <span>{resource.estimated_time} minutos</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none"
        >
          {isExpanded ? 'Mostrar menos' : 'Ver video'}
        </button>
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {resource.video_url ? (
              <iframe
                width="100%"
                height="200" // Ajustado para un tamaño más compacto
                src={resource.video_url}
                title={resource.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            ) : (
              <p className="text-gray-500">Video no disponible</p>
            )}
            <p className="text-sm text-gray-500 italic">
              {resource.video_credit || 'Créditos no disponibles'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Education() {
  const { user } = useAuthStore();
  const [resources, setResources] = useState<EducationalResource[]>(MOCK_RESOURCES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filteredResources = resources.filter(resource => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Educación Financiera
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Recursos educativos para mejorar tu comprensión financiera y laboral
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="financial">Financiera</option>
              <option value="legal">Legal</option>
              <option value="tax">Impuestos</option>
              <option value="rights">Derechos</option>
            </select>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">Todos los niveles</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
        </div>

        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))
        ) : (
          <div className="text-center py-12 col-span-full">
            <Book className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No se encontraron recursos</h3>
            <p className="mt-1 text-sm text-gray-500">Prueba ajustando tus filtros o busca algo diferente.</p>
          </div>
        )}
      </div>
    </div>
  );
}