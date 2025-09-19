import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LiveConcertSection() {
  const navigate = useNavigate();
  return (
    <div
      className="relative rounded-lg overflow-hidden h-64 bg-cover bg-center flex items-center justify-center p-8 text-white mb-8"
      style={{
        backgroundImage: `url('/Live-concert.jpg')`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

      <div className="relative text-center max-w-3xl">
        <h2 className="text-4xl font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-normal">
          Live Concerts
        </h2>
        <p className="text-lg mt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Experience the energy of live performances from top artists. See your
          favorite bands and artists from close and personal.
        </p>

        <Button
          className="mt-4 relative overflow-hidden bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-8 groupfont-bold rounded-2xl"
          onClick={() => navigate("/concerts")}
        >
          {/* <Ticket className="h-4 w-4 text-slate-100 mr-1" /> */}
          {/* Left Star */}
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-amber-300 text-lg group-hover:text-yellow-500 transition-colors duration-300">
            ★
          </span>
          Browse Tickets
          {/* Right Star */}
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-amber-300 text-lg group-hover:text-yellow-500 transition-colors duration-300">
            ★
          </span>
        </Button>
      </div>
    </div>
  );
}
