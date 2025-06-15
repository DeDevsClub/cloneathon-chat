import { Tiles } from './tiles';
import { cn } from '@/lib/utils';

export const AnimatedGridBackgroundSection: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col size-full min-h-[400px] relative overflow-hidden items-center justify-center',
        className,
      )}
    >
      <div className={'size-full relative z-[2]'}>{children}</div>
      <div className={'absolute top-0 left-0 size-screen'}>
        <Tiles rows={30} cols={20} />
      </div>
    </div>
  );
};
