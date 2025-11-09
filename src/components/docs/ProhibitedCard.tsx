interface ProhibitedCardProps {
  title: string;
  description: string;
}

export default function ProhibitedCard({ title, description }: ProhibitedCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-red-200 bg-white p-3 transition-all hover:shadow-md dark:border-red-800 dark:bg-gray-800">
      <div className="absolute right-2 top-2 text-3xl opacity-10 group-hover:opacity-20 transition-opacity">
        🚫
      </div>
      <div className="relative">
        <div className="mb-1.5 text-base font-bold text-red-600 dark:text-red-400">{title}</div>
        <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </div>
      </div>
    </div>
  );
}
