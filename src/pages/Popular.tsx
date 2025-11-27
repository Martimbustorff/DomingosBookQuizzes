import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookListSkeleton } from "@/components/shared";
import { PopularBook } from "@/types";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FeaturedCarousel } from "@/components/popular/FeaturedCarousel";
import { BookCard } from "@/components/popular/BookCard";
import { FilterChips, FilterType } from "@/components/popular/FilterChips";
import mascotBulldog from "@/assets/mascot-bulldog.png";

const INITIAL_LOAD = 20;
const LOAD_MORE_AMOUNT = 20;

const Popular = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data: allPopularBooks, isLoading } = useQuery({
    queryKey: ["popular-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popular_books_dynamic")
        .select("*")
        .order("ranking", { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        const { data: fallback } = await supabase
          .from("books")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        
        return fallback?.map((book, idx) => ({
          ...book,
          book_id: book.id,
          ranking: idx + 1,
          quiz_count: 0,
          unique_users: 0,
          avg_score: null
        }));
      }
      
      return data;
    },
  });

  const filteredBooks = useMemo(() => {
    if (!allPopularBooks) return [];

    let filtered = [...allPopularBooks];

    // Apply filter
    switch (activeFilter) {
      case "hot":
        filtered = filtered.filter(book => book.quiz_count >= 3);
        break;
      case "top-rated":
        filtered = filtered
          .filter(book => book.avg_score !== null)
          .sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0));
        break;
      case "most-read":
        filtered = filtered.sort((a, b) => b.quiz_count - a.quiz_count);
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((book: PopularBook) => 
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allPopularBooks, activeFilter, searchQuery]);

  const popularBooks = useMemo(() => {
    if (searchQuery.trim()) return filteredBooks;
    return filteredBooks?.slice(0, displayCount);
  }, [filteredBooks, displayCount, searchQuery]);

  const hasMore = !searchQuery.trim() && displayCount < (filteredBooks?.length || 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Header - Compact */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-3 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-accent/20 min-w-[44px] min-h-[44px] flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">⭐ Popular</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 space-y-4 mt-4">
        {/* Featured Carousel - Top 3 */}
        {!isLoading && allPopularBooks && allPopularBooks.length >= 3 && (
          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground px-1">🏆 Trending Now</h2>
            <FeaturedCarousel books={allPopularBooks} />
          </div>
        )}

        {/* Search Bar - Compact */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Search ${allPopularBooks?.length || 0} books...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-full shadow-sm border-2 focus:border-primary text-sm"
          />
        </div>

        {/* Filter Chips */}
        <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Book Count */}
        {!isLoading && popularBooks && (
          <p className="text-xs text-muted-foreground px-1">
            Showing <span className="font-semibold text-foreground">{popularBooks.length}</span> 
            {searchQuery ? ' matching' : ''} book{popularBooks.length !== 1 ? 's' : ''}
            {hasMore && ` (${filteredBooks?.length || 0} total)`}
          </p>
        )}

        {/* Books Grid - 2 Columns */}
        {isLoading && <BookListSkeleton count={20} />}

        {popularBooks && popularBooks.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {popularBooks.map((book: PopularBook, index: number) => (
              <BookCard key={book.book_id} book={book} index={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!popularBooks || popularBooks.length === 0) && (
          <Card className="p-12 text-center space-y-4 animate-fade-in">
            <div className="flex justify-center">
              <img 
                src={mascotBulldog} 
                alt="Domingos" 
                className="w-32 h-32 object-contain animate-bounce-subtle"
              />
            </div>
            <p className="text-xl text-foreground font-bold">
              {searchQuery 
                ? "No books found 📚"
                : "No popular books yet"}
            </p>
            <p className="text-muted-foreground">
              {searchQuery 
                ? `Try searching for something else`
                : "Check back soon for trending books!"}
            </p>
          </Card>
        )}

        {/* Load More Button - Inline */}
        {hasMore && !isLoading && (
          <div className="pt-2 pb-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => setDisplayCount(prev => prev + LOAD_MORE_AMOUNT)}
              className="w-full rounded-full shadow-md min-h-[48px] font-bold"
            >
              ↓ Load More ({displayCount}/{filteredBooks?.length || 0})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popular;
