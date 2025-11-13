import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Star } from "lucide-react";
import mascotBulldog from "@/assets/mascot-bulldog.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-12 text-center">
        {/* Mascot */}
        <div className="flex justify-center animate-float">
          <img 
            src={mascotBulldog} 
            alt="Domingos the Reading Bulldog" 
            className="w-40 h-40 md:w-48 md:h-48 drop-shadow-2xl"
          />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text">
            Domingos Book Quiz
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Fun questions for little readers! 📚
          </p>
        </div>

        {/* Main Actions */}
        <div className="space-y-6 pt-8">
          <Button
            size="lg"
            className="w-full h-16 text-xl font-bold rounded-[24px] shadow-[0_8px_32px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_48px_rgba(99,102,241,0.5)] transition-all quiz-button"
            onClick={() => navigate("/search")}
          >
            <BookOpen className="mr-2 h-6 w-6" />
            🔍 Find my book
          </Button>

          <Button
            size="lg"
            variant="gradient"
            className="w-full h-16 text-xl font-bold rounded-[24px] shadow-[0_8px_32px_rgba(168,85,247,0.3)] hover:shadow-[0_12px_48px_rgba(168,85,247,0.5)] transition-all quiz-button"
            onClick={() => navigate("/popular")}
          >
            <Star className="mr-2 h-6 w-6" />
            ⭐ Popular books
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-12 text-sm text-muted-foreground font-medium">
          <p>Free • No login required • Safe for kids</p>
        </div>
      </div>
    </div>
  );
};

export default Home;