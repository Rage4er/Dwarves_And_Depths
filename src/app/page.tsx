import type { Metadata } from 'next';
import { GameProvider } from '@/lib/game/store';
import { GameRoot } from '@/components/game/GameRoot';

export const metadata: Metadata = {
  title: 'Гномы и Глубины — подземный рогалик',
  description:
    'Собери отряд гномов, снаряди их и спускайся на 8–11 этажей подземелья к Сердцу Глубин. Автобои, синергии снаряжения, наследие и офлайн-добыча.',
};

export default function IndexPage() {
  return (
    <GameProvider>
      <main className="min-h-dvh">
        <GameRoot />
      </main>
    </GameProvider>
  );
}
