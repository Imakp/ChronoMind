"use client";

import { useInlineTagIndicators } from "@/hooks/use-inline-tag-indicators";
import { InlineTagIndicator } from "@/components/editor/inline-tag-indicator";

interface InlineTagProviderProps {
  children: React.ReactNode;
  onTagClick?: (tagName: string) => void;
}

export function InlineTagProvider({
  children,
  onTagClick,
}: InlineTagProviderProps) {
  const { indicatorState } = useInlineTagIndicators();

  return (
    <>
      {children}
      <InlineTagIndicator
        tags={indicatorState.tags}
        position={indicatorState.position}
        visible={indicatorState.visible}
        onTagClick={onTagClick}
      />
    </>
  );
}
