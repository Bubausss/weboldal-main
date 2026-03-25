import { motion } from 'framer-motion';
import { HelpCircle, Mail, FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

const SupportPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const faqs = [
    {
      question: "How do I activate the driver?",
      answer: "After login, the driver is automatically initialized. Navigate to the Config page to enable specific modules."
    },
    {
      question: "What happens if I get detected?",
      answer: "Our driver uses advanced memory techniques. If issues occur, disable all modules and wait for the next update."
    },
    {
      question: "How do I extend my subscription?",
      answer: "Contact an administrator via the community channels or wait for subscription extension opportunities."
    },
    {
      question: "Can I share my invite key?",
      answer: "Each invite key is single-use and tied to one account. Sharing is prohibited and will result in a ban."
    },
    {
      question: "What is the killswitch?",
      answer: "The killswitch is an emergency measure that disables all active drivers network-wide in case of critical threats."
    }
  ];

  return (
    <motion.div
      data-testid="support-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white text-glow">
          SUPPORT
        </h1>
        <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mt-2">
          Help & Documentation
        </p>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-500 cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/5 rounded-sm group-hover:bg-white/10 transition-colors">
              <FileText className="h-5 w-5 text-white/60" />
            </div>
            <div>
              <p className="font-serif text-lg text-white mb-1">Documentation</p>
              <p className="font-mono text-xs text-white/40">Setup guides & tutorials</p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-500 cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/5 rounded-sm group-hover:bg-white/10 transition-colors">
              <Mail className="h-5 w-5 text-white/60" />
            </div>
            <div>
              <p className="font-serif text-lg text-white mb-1">Contact</p>
              <p className="font-mono text-xs text-white/40">Priority support ticket</p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6 hover:border-white/20 transition-all duration-500 cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/5 rounded-sm group-hover:bg-white/10 transition-colors">
              <AlertTriangle className="h-5 w-5 text-white/60" />
            </div>
            <div>
              <p className="font-serif text-lg text-white mb-1">Report Issue</p>
              <p className="font-mono text-xs text-white/40">Bug reports & feedback</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div variants={itemVariants}>
        <h2 className="font-serif text-xl tracking-tight text-white mb-6 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-white/40" />
          FREQUENTLY ASKED
        </h2>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-b border-white/5 last:border-0"
              >
                <AccordionTrigger 
                  data-testid={`faq-trigger-${index}`}
                  className="px-6 py-4 font-mono text-sm text-white/80 hover:text-white hover:no-underline"
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 font-mono text-sm text-white/40 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.div>

      {/* Status Section */}
      <motion.div variants={itemVariants}>
        <h2 className="font-serif text-xl tracking-tight text-white mb-6">
          SYSTEM STATUS
        </h2>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-white/60">Driver Core</span>
              <span className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="font-mono text-xs text-green-400">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-white/60">API Services</span>
              <span className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="font-mono text-xs text-green-400">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-white/60">Update Server</span>
              <span className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="font-mono text-xs text-green-400">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-white/60">Authentication</span>
              <span className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="font-mono text-xs text-green-400">Operational</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SupportPage;
