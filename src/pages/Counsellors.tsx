import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Calendar, Clock, Star, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Layout from '@/components/layout/Layout';

interface Counsellor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specializations: string[];
  experience: string;
  rating: number;
  reviews: number;
  languages: string[];
  availableSlots: string[];
  bio: string;
}

const COUNSELLORS: Counsellor[] = [
  {
    id: '1',
    name: 'Dr. Meera Sharma',
    avatar: 'MS',
    title: 'Clinical Psychologist',
    specializations: ['Anxiety', 'Depression', 'Academic Stress'],
    experience: '12 years',
    rating: 4.9,
    reviews: 234,
    languages: ['English', 'Hindi'],
    availableSlots: ['10:00 AM', '2:00 PM', '4:00 PM'],
    bio: 'Specializing in cognitive behavioral therapy with a focus on helping students navigate academic and personal challenges.'
  },
  {
    id: '2',
    name: 'Dr. Arjun Patel',
    avatar: 'AP',
    title: 'Counseling Psychologist',
    specializations: ['Relationship Issues', 'Self-Esteem', 'Career Guidance'],
    experience: '8 years',
    rating: 4.8,
    reviews: 156,
    languages: ['English', 'Hindi', 'Gujarati'],
    availableSlots: ['11:00 AM', '3:00 PM', '5:00 PM'],
    bio: 'Passionate about helping young adults discover their potential and build meaningful relationships.'
  },
  {
    id: '3',
    name: 'Dr. Priya Nair',
    avatar: 'PN',
    title: 'Child & Adolescent Psychiatrist',
    specializations: ['ADHD', 'Trauma', 'Family Therapy'],
    experience: '15 years',
    rating: 4.9,
    reviews: 312,
    languages: ['English', 'Hindi', 'Malayalam'],
    availableSlots: ['9:00 AM', '1:00 PM', '6:00 PM'],
    bio: 'Expert in adolescent mental health with a compassionate, evidence-based approach to treatment.'
  },
  {
    id: '4',
    name: 'Dr. Rahul Verma',
    avatar: 'RV',
    title: 'Clinical Psychologist',
    specializations: ['OCD', 'Panic Disorders', 'Sleep Issues'],
    experience: '10 years',
    rating: 4.7,
    reviews: 189,
    languages: ['English', 'Hindi'],
    availableSlots: ['10:30 AM', '2:30 PM', '4:30 PM'],
    bio: 'Specialized in anxiety disorders with expertise in exposure therapy and mindfulness-based interventions.'
  },
];

export default function Counsellors() {
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState<{ counsellor: string; slot: string; date: string }[]>([]);

  const handleBook = () => {
    if (selectedCounsellor && selectedSlot) {
      setBookedAppointments(prev => [...prev, {
        counsellor: selectedCounsellor.name,
        slot: selectedSlot,
        date: new Date().toLocaleDateString()
      }]);
      setBookingComplete(true);
    }
  };

  const resetBooking = () => {
    setSelectedCounsellor(null);
    setSelectedSlot('');
    setBookingComplete(false);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            <UserCircle className="w-8 h-8 text-green-600" />
            Book a Counsellor
          </h1>
          <p className="text-muted-foreground mt-1">Connect with verified mental health professionals</p>
        </div>

        {/* Upcoming Appointments */}
        {bookedAppointments.length > 0 && (
          <Card className="mined-card mb-6 border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bookedAppointments.map((apt, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{apt.counsellor}</p>
                      <p className="text-sm text-muted-foreground">{apt.slot} • {apt.date}</p>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Counsellors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COUNSELLORS.map((counsellor, i) => (
            <motion.div
              key={counsellor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="mined-card h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl font-display">
                        {counsellor.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {counsellor.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{counsellor.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{counsellor.rating}</span>
                        <span className="text-sm text-muted-foreground">({counsellor.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{counsellor.bio}</p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {counsellor.specializations.map(spec => (
                      <span key={spec} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {counsellor.experience}
                      </span>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="gap-1"
                          onClick={() => {
                            setSelectedCounsellor(counsellor);
                            setBookingComplete(false);
                            setSelectedSlot('');
                          }}
                        >
                          Book Now
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-display">
                            {bookingComplete ? 'Booking Confirmed!' : `Book with ${counsellor.name}`}
                          </DialogTitle>
                        </DialogHeader>
                        
                        {bookingComplete ? (
                          <div className="py-8 text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="font-display text-xl font-semibold mb-2">You're all set!</h3>
                            <p className="text-muted-foreground mb-6">
                              Your appointment with {counsellor.name} is confirmed for {selectedSlot}.
                            </p>
                            <Button onClick={resetBooking}>Done</Button>
                          </div>
                        ) : (
                          <div className="space-y-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {counsellor.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{counsellor.name}</p>
                                <p className="text-sm text-muted-foreground">{counsellor.title}</p>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4" />
                                Select a time slot
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {counsellor.availableSlots.map(slot => (
                                  <Button
                                    key={slot}
                                    variant={selectedSlot === slot ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedSlot(slot)}
                                  >
                                    {slot}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 bg-muted rounded-lg text-sm">
                              <p className="font-medium mb-1">Session Details</p>
                              <p className="text-muted-foreground">45-minute video consultation</p>
                              <p className="text-muted-foreground">Languages: {counsellor.languages.join(', ')}</p>
                            </div>

                            <Button 
                              className="w-full" 
                              disabled={!selectedSlot}
                              onClick={handleBook}
                            >
                              Confirm Booking
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
