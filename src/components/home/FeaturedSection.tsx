import React from 'react';
import { Camera } from 'lucide-react';
import { Destination } from '@/lib/types';
import { Section, SectionHeader } from './Section';
import { HorizontalScroller } from './HorizontalScroller';
import { PlaceCard } from './PlaceCard';
import { destinationToCard } from './adapters';

interface FeaturedSectionProps {
  featured: Destination[];
}

export function FeaturedSection({ featured }: FeaturedSectionProps) {
  if (!featured || featured.length === 0) return null;

  return (
    <Section tone="base">
      <SectionHeader
        eyebrow="Galeria Patrimonial"
        icon={Camera}
        title="Destinos Destacados"
        subtitle="Los atractivos mas emblematicos del pueblo tematico de Condorito."
        action={{ href: '/mapa', label: 'Ver todos en el mapa' }}
      />

      <HorizontalScroller cols={4}>
        {featured.slice(0, 8).map((d) => (
          <PlaceCard key={d.id} item={destinationToCard(d)} />
        ))}
      </HorizontalScroller>
    </Section>
  );
}
