import { motion } from 'framer-motion';
import { HelpCircle, Phone, MessageCircle, Mail, ExternalLink, Heart, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Layout from '@/components/layout/Layout';

const FAQS = [
  {
    question: "How do I log my daily mood?",
    answer: "Navigate to the Mood Calendar page and click 'Log Today's Mood'. Select an emoji that represents how you're feeling, adjust the intensity, and add an optional note. Your entry will be saved and visible on the calendar."
  },
  {
    question: "What is the Emotion Alchemist?",
    answer: "The Emotion Alchemist is an AI-powered tool that helps you process and transform difficult emotions. Share what you're feeling, and it will provide therapeutic reflections, reframing perspectives, and practical suggestions."
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes, absolutely. All your journal entries, mood logs, and personal information are encrypted and stored securely. Only you can access your data when logged in."
  },
  {
    question: "How does the Community feature work?",
    answer: "The Community is a peer-support space where you can share experiences, offer support, and connect with others on similar journeys. You can post anonymously and react to others' posts with support, relate, or helpful reactions."
  },
  {
    question: "What are Time Capsules?",
    answer: "Time Capsules let you record messages (text, voice, or video) for your future self. You set an unlock date, and the capsule remains sealed until then. It's a powerful way to track your growth and send encouragement to your future self."
  },
  {
    question: "How can I book a counsellor?",
    answer: "Go to the Book Counsellor page, browse verified mental health professionals, and select an available time slot. You'll receive a confirmation and can manage your bookings from your profile."
  }
];

const HELPLINES = [
  {
    name: "iCall",
    number: "9152987821",
    description: "Professional counseling service by TISS",
    hours: "Mon-Sat, 8 AM - 10 PM"
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-2662-345",
    description: "24/7 mental health support",
    hours: "24 hours, 7 days"
  },
  {
    name: "NIMHANS",
    number: "080-46110007",
    description: "National Institute of Mental Health",
    hours: "Mon-Fri, 9 AM - 5 PM"
  },
  {
    name: "Snehi",
    number: "044-24640050",
    description: "Emotional support and crisis intervention",
    hours: "24 hours, 7 days"
  }
];

export default function Help() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Help & Support
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find answers to common questions and access crisis resources
          </p>
        </div>

        {/* Crisis Banner */}
        <Card className="mb-8 border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive mb-2">In Crisis? Get Help Now</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  If you're in immediate danger or experiencing a mental health emergency, please reach out to one of the helplines below or call emergency services.
                </p>
                <Button variant="destructive" size="sm" asChild>
                  <a href="tel:112">
                    <Phone className="w-4 h-4 mr-2" />
                    Emergency: 112
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Helplines */}
        <Card className="mined-card mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Mental Health Helplines (India)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {HELPLINES.map((helpline) => (
              <div key={helpline.name} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{helpline.name}</h4>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${helpline.number.replace(/-/g, '')}`}>
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{helpline.description}</p>
                <p className="text-xs text-muted-foreground">{helpline.hours}</p>
                <p className="text-sm font-medium text-primary mt-2">{helpline.number}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="mined-card mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mined-card">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Have a question or feedback? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a href="mailto:support@mined.app">
                  <Mail className="w-4 h-4 mr-2" />
                  support@mined.app
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Message */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold mb-2">You're Not Alone</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Remember, seeking help is a sign of strength. Whether you're having a tough day or going through a difficult time, support is always available.
          </p>
        </div>
      </motion.div>
    </Layout>
  );
}
