
import React from 'react';

interface FlowerCardProps {
  name: string;
  description: string;
  category: string;
  image?: string;
}

export const FlowerCard: React.FC<FlowerCardProps> = ({ name, description, category, image }) => {
  const placeholderImage = `https://picsum.photos/seed/${name}/400/300`;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-nature-100 group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image || placeholderImage} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-nature-50 text-nature-600 text-xs font-bold rounded-full uppercase tracking-wider">
            {category}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-nature-900 mb-2">{name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {description}
        </p>
        <button className="mt-4 text-nature-600 text-sm font-semibold flex items-center hover:text-nature-700">
          Learn More
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
