import { useState } from "react";
import WorksheetForm, { FormData } from "@/components/WorksheetForm";
import Sidebar from "@/components/Sidebar";
import GeneratingModal from "@/components/GeneratingModal";
import WorksheetDisplay from "@/components/WorksheetDisplay";
import { useToast } from "@/hooks/use-toast";

// Mock data for initial development
const mockWorksheetData = {
  title: "Professional Communication in Customer Service",
  subtitle: "Improving Service Quality through Effective Communication",
  introduction: "This worksheet focuses on developing communication skills essential for customer service professionals. It covers key vocabulary, active listening techniques, and practical scenarios to improve service quality.",
  exercises: [
    {
      type: "reading",
      title: "Exercise 1: Reading Comprehension",
      icon: "fa-book-open",
      time: 8,
      instructions: "Read the following text about customer service best practices and answer the questions below.",
      content: "Excellent customer service is essential for any business to succeed in today's competitive marketplace. The way a company treats its customers can make the difference between success and failure. Active listening is one of the most important skills for any customer service representative. This means paying full attention to what customers are saying, acknowledging their concerns, and responding appropriately.\n\nEmpathy plays a crucial role in understanding customer needs. By putting yourself in the customer's position, you can better understand their frustrations and find more effective solutions. Clear communication is equally important - using simple language, avoiding jargon, and confirming understanding can prevent misunderstandings.\n\nProfessional behavior, including remaining calm under pressure and maintaining a positive attitude, helps create a good impression. Finally, problem-solving skills are vital for resolving customer issues efficiently and effectively.",
      questions: [
        { text: "Why is customer service important for businesses?", answer: "It can make the difference between success and failure in today's competitive marketplace." },
        { text: "What does active listening involve?", answer: "Paying full attention, acknowledging concerns, and responding appropriately." },
        { text: "How does empathy help in customer service?", answer: "It helps understand customer frustrations and find more effective solutions." },
        { text: "What communication practices can prevent misunderstandings?", answer: "Using simple language, avoiding jargon, and confirming understanding." },
        { text: "Name two aspects of professional behavior mentioned in the text.", answer: "Remaining calm under pressure and maintaining a positive attitude." }
      ],
      teacher_tip: "Before reading, discuss with your student if they have any experience with customer service. After reading, ask them to identify which skills they think they already possess and which they need to develop further."
    },
    {
      type: "matching",
      title: "Exercise 2: Vocabulary Matching",
      icon: "fa-link",
      time: 7,
      instructions: "Match each term with its correct definition.",
      items: [
        { term: "Active listening", definition: "Fully concentrating on what is being said rather than just passively hearing" },
        { term: "Empathy", definition: "The ability to understand and share the feelings of another" },
        { term: "Professionalism", definition: "The competence or skill expected of a professional" },
        { term: "Virtual platform", definition: "A video conferencing tool" },
        { term: "Customer retention", definition: "Keeping existing customers over time" },
        { term: "Clear communication", definition: "Conveying information in a straightforward manner" },
        { term: "Zoom", definition: "A video conferencing platform used for virtual meetings" },
        { term: "Microsoft Teams", definition: "A collaboration platform with chat, meetings, and files" },
        { term: "Customer satisfaction", definition: "Fulfillment of one's expectations or needs" },
        { term: "Hospitality", definition: "The way a business interacts with its guests" }
      ],
      teacher_tip: "Have your student explain why they matched each pair. Ask them to provide examples of how each concept applies in real workplace situations."
    },
    {
      type: "fill-in-blanks",
      title: "Exercise 3: Fill in the Blanks",
      icon: "fa-pencil-alt",
      time: 8,
      instructions: "Complete each sentence with the correct word from the box.",
      word_bank: ["empathy", "listening", "feedback", "professional", "service", "communication", "virtual", "customers", "satisfaction", "experience"],
      sentences: [
        { text: "Active _____ is crucial for understanding customer needs.", answer: "listening" },
        { text: "Showing _____ helps build rapport with difficult customers.", answer: "empathy" },
        { text: "Customer _____ surveys help businesses improve their offerings.", answer: "satisfaction" },
        { text: "Maintaining a _____ appearance creates a good first impression.", answer: "professional" },
        { text: "Effective _____ prevents misunderstandings with clients.", answer: "communication" },
        { text: "Many companies now offer _____ meetings as an alternative to in-person appointments.", answer: "virtual" },
        { text: "The overall customer _____ depends on many small interactions.", answer: "experience" },
        { text: "Providing constructive _____ to team members improves service quality.", answer: "feedback" },
        { text: "High-quality _____ leads to customer loyalty and retention.", answer: "service" },
        { text: "Understanding the needs of diverse _____ requires cultural awareness.", answer: "customers" }
      ],
      teacher_tip: "After completing the exercise, ask your student to create their own sentences using these key terms to check their understanding in different contexts."
    },
    {
      type: "multiple-choice",
      title: "Exercise 4: Multiple Choice",
      icon: "fa-check-square",
      time: 7,
      instructions: "Choose the best option to complete each sentence.",
      questions: [
        {
          text: "Which platform is commonly used for virtual meetings?",
          options: [
            { label: "A", text: "Twitter", correct: false },
            { label: "B", text: "Instagram", correct: false },
            { label: "C", text: "Zoom", correct: true },
            { label: "D", text: "Pinterest", correct: false }
          ]
        },
        {
          text: "What is crucial for understanding guest needs?",
          options: [
            { label: "A", text: "Ignoring", correct: false },
            { label: "B", text: "Empathy", correct: true },
            { label: "C", text: "Rudeness", correct: false },
            { label: "D", text: "Indifference", correct: false }
          ]
        },
        {
          text: "What ensures a pleasant guest experience?",
          options: [
            { label: "A", text: "Professionalism", correct: true },
            { label: "B", text: "Negligence", correct: false },
            { label: "C", text: "Carelessness", correct: false },
            { label: "D", text: "Disrespect", correct: false }
          ]
        },
        {
          text: "Which tool is used for team collaboration?",
          options: [
            { label: "A", text: "Facebook", correct: false },
            { label: "B", text: "Snapchat", correct: false },
            { label: "C", text: "LinkedIn", correct: false },
            { label: "D", text: "Microsoft Teams", correct: true }
          ]
        },
        {
          text: "What should you do when a customer is angry?",
          options: [
            { label: "A", text: "Interrupt them", correct: false },
            { label: "B", text: "Listen patiently", correct: true },
            { label: "C", text: "Argue back", correct: false },
            { label: "D", text: "Ignore them", correct: false }
          ]
        },
        {
          text: "Which communication style is best for customer service?",
          options: [
            { label: "A", text: "Clear and concise", correct: true },
            { label: "B", text: "Vague and technical", correct: false },
            { label: "C", text: "Rapid and complex", correct: false },
            { label: "D", text: "Formal and distant", correct: false }
          ]
        },
        {
          text: "What is important for following up with customers?",
          options: [
            { label: "A", text: "Being inconsistent", correct: false },
            { label: "B", text: "Making excuses", correct: false },
            { label: "C", text: "Being timely", correct: true },
            { label: "D", text: "Avoiding details", correct: false }
          ]
        },
        {
          text: "What skill helps resolve customer complaints?",
          options: [
            { label: "A", text: "Defensiveness", correct: false },
            { label: "B", text: "Problem-solving", correct: true },
            { label: "C", text: "Blame shifting", correct: false },
            { label: "D", text: "Procrastination", correct: false }
          ]
        },
        {
          text: "Which metric measures customer happiness?",
          options: [
            { label: "A", text: "Profit margin", correct: false },
            { label: "B", text: "Employee turnover", correct: false },
            { label: "C", text: "Satisfaction score", correct: true },
            { label: "D", text: "Marketing budget", correct: false }
          ]
        },
        {
          text: "What does empathetic communication involve?",
          options: [
            { label: "A", text: "Acknowledging feelings", correct: true },
            { label: "B", text: "Dismissing concerns", correct: false },
            { label: "C", text: "Speaking quickly", correct: false },
            { label: "D", text: "Using complex terminology", correct: false }
          ]
        }
      ],
      teacher_tip: "For each question, ask your student to explain why the correct answer is appropriate and why the other options are not suitable in a customer service context."
    },
    {
      type: "dialogue",
      title: "Exercise 5: Speaking Practice",
      icon: "fa-comments",
      time: 10,
      instructions: "Practice the following dialogue with a partner. Then create your own similar conversation.",
      dialogue: [
        { speaker: "Customer", text: "Excuse me, I ordered this laptop online last week, but when I opened it, I noticed a scratch on the screen." },
        { speaker: "Representative", text: "I'm very sorry to hear that. I understand how disappointing that must be." },
        { speaker: "Customer", text: "Yes, it's quite frustrating. I paid a lot of money for a brand new product." },
        { speaker: "Representative", text: "You're absolutely right, and I apologize for the inconvenience. Let me help you resolve this issue right away." },
        { speaker: "Customer", text: "What options do I have?" },
        { speaker: "Representative", text: "You have several options. We can offer a full refund, a replacement unit, or a discount if you prefer to keep this one." },
        { speaker: "Customer", text: "I'd prefer a replacement if possible. How long would that take?" },
        { speaker: "Representative", text: "We have the same model in stock. I can process the exchange today, and you should receive the new laptop within 3 business days." },
        { speaker: "Customer", text: "That sounds reasonable. Thank you for your help." },
        { speaker: "Representative", text: "You're welcome. Is there anything else I can assist you with today?" }
      ],
      expression_instruction: "Now create your own dialogue using these expressions:",
      expressions: [
        "I understand your concern about...",
        "Let me check that for you right away.",
        "I apologize for the inconvenience.",
        "We have several options available.",
        "What would work best for you?",
        "I'd be happy to help with that.",
        "We can certainly arrange that for you.",
        "Thank you for your patience.",
        "Is there anything else I can help you with?",
        "Please don't hesitate to contact us again if needed."
      ],
      teacher_tip: "Role-play this dialogue, then have your student create a new scenario with a different product or service issue. Switch roles to give them practice both as the customer and the representative."
    },
    {
      type: "discussion",
      title: "Exercise 6: Discussion",
      icon: "fa-question-circle",
      time: 5,
      instructions: "Discuss the following questions with your partner or in small groups.",
      questions: [
        "What do you think makes the difference between good and excellent customer service?",
        "Can you describe a time when you received exceptional customer service? What made it special?",
        "How important is body language and tone of voice in customer service interactions?",
        "How might cultural differences affect customer service expectations?",
        "In what ways has technology changed customer service in recent years?"
      ],
      teacher_tip: "Encourage your student to provide specific examples and detailed explanations. This exercise works well as a warm-up or conclusion to the lesson."
    }
  ],
  vocabulary_sheet: [
    { term: "Active listening", meaning: "Empty Space for Definition" },
    { term: "Empathy", meaning: "Empty Space for Definition" },
    { term: "Customer retention", meaning: "Empty Space for Definition" },
    { term: "Professional etiquette", meaning: "Empty Space for Definition" },
    { term: "Service recovery", meaning: "Empty Space for Definition" },
    { term: "Conflict resolution", meaning: "Empty Space for Definition" },
    { term: "Virtual meeting", meaning: "Empty Space for Definition" },
    { term: "Customer satisfaction", meaning: "Empty Space for Definition" },
    { term: "Problem-solving", meaning: "Empty Space for Definition" },
    { term: "Rapport building", meaning: "Empty Space for Definition" },
    { term: "Troubleshooting", meaning: "Empty Space for Definition" },
    { term: "Service quality", meaning: "Empty Space for Definition" },
    { term: "Client communication", meaning: "Empty Space for Definition" },
    { term: "Feedback mechanism", meaning: "Empty Space for Definition" },
    { term: "Customer loyalty", meaning: "Empty Space for Definition" }
  ]
};

export default function Index() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorksheet, setGeneratedWorksheet] = useState<any>(null);
  const [inputParams, setInputParams] = useState<FormData | null>(null);
  const { toast } = useToast();
  
  const [generationTime, setGenerationTime] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);

  const handleFormSubmit = (data: FormData) => {
    setInputParams(data);
    setIsGenerating(true);
    
    // Simulate generation time (between 30-60 seconds)
    const genTime = Math.floor(Math.random() * (65 - 31) + 31);
    setGenerationTime(genTime);
    
    // Simulate source count (between 50-90 sources)
    const sources = Math.floor(Math.random() * (90 - 50) + 50);
    setSourceCount(sources);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedWorksheet(mockWorksheetData);
      
      toast({
        title: "Worksheet generated successfully!",
        description: "Your custom worksheet is now ready to use."
      });
    }, 5000); // Show loading for 5 seconds in the demo
  };

  const handleBack = () => {
    setGeneratedWorksheet(null);
    setInputParams(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!generatedWorksheet ? (
        <div className="container mx-auto py-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-4">
              <WorksheetForm onSubmit={handleFormSubmit} />
            </div>
            <div className="md:col-span-1">
              <Sidebar />
            </div>
          </div>
        </div>
      ) : (
        <WorksheetDisplay 
          worksheet={generatedWorksheet} 
          inputParams={inputParams} 
          generationTime={generationTime}
          sourceCount={sourceCount}
          onBack={handleBack}
        />
      )}
      
      <GeneratingModal isOpen={isGenerating} />
    </div>
  );
}
