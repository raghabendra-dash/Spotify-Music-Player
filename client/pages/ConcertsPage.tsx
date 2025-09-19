import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, CheckCircle2, SquareCheck } from "lucide-react";

const concertsData = [
  {
    id: "concert-1",
    artist: "Taylor Swift",
    artistImage: "/taylor-swift.jpg",
    date: "2026-01-15",
    location: "New York, NY",
  },
  {
    id: "concert-4",
    artist: "Arijit Singh",
    artistImage: "/arijit-singh.jpeg",
    date: "2026-04-05",
    location: "Mumbai, India",
  },
  {
    id: "concert-6",
    artist: "Sid Sriram",
    artistImage: "/Sid-Sriram.jpg",
    date: "2026-02-10",
    location: "Chennai, India",
  },
  {
    id: "concert-2",
    artist: "Adam Levine",
    artistImage: "/adam-levine.png",
    date: "2026-11-20",
    location: "Los Angeles, CA",
  },
  {
    id: "concert-3",
    artist: "Jonas Brothers",
    artistImage: "/jonas-brothers.jpg",
    date: "2026-02-28",
    location: "Chicago, IL",
  },
  {
    id: "concert-5",
    artist: "Post Malone",
    artistImage: "/post-malone.jpg",
    date: "2026-10-12",
    location: "Austin, TX",
  },
  {
    id: "concert-7",
    artist: "Katy Perry",
    artistImage: "/katy-perry.png",
    date: "2024-12-25",
    location: "Las Vegas, NV",
  },
];

const ConcertsPage = () => {
  const [selectedConcertId, setSelectedConcertId] = useState<string | null>(
    null,
  );
  const [confirmedConcert, setConfirmedConcert] = useState<any | null>(null);

  const handleSelectConcert = (concertId: string) => {
    if (selectedConcertId === concertId) {
      setSelectedConcertId(null);
    } else {
      setSelectedConcertId(concertId);
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedConcertId) {
      toast.error("Please select a concert to book.");
      return;
    }
    const selectedConcert = concertsData.find(
      (c) => c.id === selectedConcertId,
    );
    if (selectedConcert) {
      toast.success(`Booking confirmed for ${selectedConcert.artist}`);
      setConfirmedConcert(selectedConcert);
    }
  };

  const handleBackToConcerts = () => {
    setConfirmedConcert(null);
    setSelectedConcertId(null);
  };

  if (confirmedConcert) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white p-4 sm:p-6 md:p-8"
        style={{ backgroundImage: "url('/lightco.jpg')" }}
      >
        <div className="max-w-2xl mx-auto bg-black/60 backdrop-blur-sm p-8 rounded-xl drop-shadow-2xl border border-purple-800">
          <div className="text-center">
            <img
              src={confirmedConcert.artistImage}
              alt={confirmedConcert.artist}
              className="w-48 h-48 rounded-full object-cover border-4 border-purple-600 mx-auto shadow-xl"
            />
            <h1 className="text-3xl font-serif font-bold mt-4">
              {confirmedConcert.artist}
            </h1>
            <p className="text-slate-300 text-lg">
              {confirmedConcert.date} - {confirmedConcert.location}
            </p>
          </div>

          <Card className="mt-8 bg-white/10 border border-transparent ring-4 ring-green-600/80">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <h2 className="text-2xl text-white font-bold">
                  Ticket Confirmed!
                </h2>
                <p className="text-white/80 mt-2">
                  You're all set to see {confirmedConcert.artist} :-)
                </p>
                <p className="text-xs text-white/70 mt-4">
                  A confirmation email has been sent to your address.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="text-center mt-8 space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToConcerts}
              className="bg-purple-500 border-purple-500 text-purple-100 hover:bg-purple-500 hover:text-white"
            >
              Back to Concerts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white p-3 sm:p-6 md:p-7"
      style={{ backgroundImage: "url('/music-festival.png')" }}
    >
      <div className="max-w-4xl mx-auto bg-black/65 backdrop-blur-sm p-6 rounded-lg border border-violet-900">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-center mb-8">
          Upcoming Concerts
        </h1>
        <div className="space-y-6 drop-shadow-md">
          {concertsData.map((concert) => (
            <Card
              key={concert.id}
              onClick={() => handleSelectConcert(concert.id)}
              className={`cursor-pointer transition-all duration-200 bg-gray-800/50 border-indigo-900 ${selectedConcertId === concert.id ? "ring-1 ring-purple-500" : "ring-1 ring-zinc-700"}`}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <img
                  src={concert.artistImage}
                  alt={concert.artist}
                  className="w-24 h-24 rounded-full object-cover border-2 border-purple-500 "
                />
                <div className="flex-grow text-center sm:text-left">
                  <h2 className="text-2xl font-semibold text-gray-200">
                    {concert.artist}
                  </h2>
                  <p className="text-slate-300">{concert.date}</p>
                  <p className="text-zinc-300">{concert.location}</p>
                </div>
                {selectedConcertId === concert.id && (
                  <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center space-x-4">
          <Button
            size="lg"
            onClick={handleConfirmBooking}
            disabled={!selectedConcertId}
            className="bg-violet-600 hover:bg-purple-700 text-purple-200"
          >
            Confirm Booking
          </Button>
          {/* <span className="bg-transparent rounded-xl shadow-lg className="bg-transparent border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white"> */}
          <Link to="/">
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-purple-500 text-purple-400 hover:bg-violet-600 hover:text-white"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConcertsPage;
