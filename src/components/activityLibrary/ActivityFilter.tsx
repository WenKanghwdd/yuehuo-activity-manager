import { Search, X } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActivityTag } from '../../types';
import { ACTIVITY_TAGS } from '../../types';

interface ActivityFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: ActivityTag[];
  onToggleTag: (tag: ActivityTag) => void;
  onClearFilters: () => void;
}

export default function ActivityFilter({
  searchQuery,
  onSearchChange,
  selectedTags,
  onToggleTag,
  onClearFilters,
}: ActivityFilterProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange]
  );

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    debouncedSearch(value);
  };

  const hasFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="搜索活动名称..."
          className="w-full pl-9 pr-4 py-2.5 border border-warm-200 rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-warm-500 outline-none bg-white"
        />
        {localSearch && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tag Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="flex gap-1.5 shrink-0">
          {ACTIVITY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-warm-500 text-white'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="whitespace-nowrap px-3 py-1.5 text-xs text-warm-500 hover:text-warm-700 shrink-0"
          >
            清除筛选
          </button>
        )}
      </div>
    </div>
  );
}
