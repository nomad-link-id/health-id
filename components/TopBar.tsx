interface TopBarProps {
  disclosedLabel?: string;
}

export default function TopBar({
  disclosedLabel = "Identifiable records disclosed: 0",
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-10 py-6">
      <div>
        <div className="text-2xl font-bold tracking-tight text-gray-900">
          RESEARCH PASSPORT
        </div>
        <div className="mt-1 text-sm text-gray-500">
          Patient-controlled · Source-preserving · Minimum disclosure
        </div>
      </div>
      <div className="rounded-full border border-gray-300 bg-gray-50 px-5 py-2 text-sm font-medium text-gray-700">
        {disclosedLabel}
      </div>
    </div>
  );
}
