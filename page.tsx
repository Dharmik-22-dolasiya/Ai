
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Added for completeness, though not directly used in this revised version
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Image as ImageIcon, Mic, Send, Activity, Loader2, AlertTriangle, BookOpen, Lightbulb, BarChartBig, Copy, XCircle, Brain, Bot, UploadCloud, User, Smile, TrendingUp, Video as VideoIcon, CameraOff } from 'lucide-react';
import { processTextQuery, ProcessTextQueryInput, ProcessTextQueryOutput, ConversationTurn } from '@/ai/flows/process-text-query';
import { processVoiceQuery, ProcessVoiceQueryInput, ProcessVoiceQueryOutput } from '@/ai/flows/process-voice-query';
import { processImageQuery, ProcessImageQueryInput, ProcessImageQueryOutput } from '@/ai/flows/process-image-query';
import { useToast } from '@/hooks/use-toast';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";

type AiMessage = {
  text?: string;
  chartData?: any[];
  imageUrl?: string; // Used in image tab response
};

type TextHistoryEntry = {
  user: string;
  assistant: AiMessage;
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<'text' | 'voice' | 'image'>('text');

  const [textQuery, setTextQuery] = React.useState('');
  const [textHistory, setTextHistory] = React.useState<TextHistoryEntry[]>([]);

  const [imageQueryText, setImageQueryText] = React.useState('');
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const [isRecording, setIsRecording] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const [isLoading, setIsLoading] = React.useState<{[key: string]: boolean}>({ text: false, voice: false, image: false, facialAnalysis: false });
  const [aiVoiceResponse, setAiVoiceResponse] = React.useState<AiMessage | null>(null);
  const [aiImageResponse, setAiImageResponse] = React.useState<AiMessage | null>(null);
  const [error, setError] = React.useState<{[key: string]: string | null}>({ text: null, voice: null, image: null, facialAnalysis: null });

  const inputRefImage = React.useRef<HTMLInputElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [isFacialAnalysisRunning, setIsFacialAnalysisRunning] = React.useState(false);
  const [facialAnalysisResult, setFacialAnalysisResult] = React.useState<string | null>(null);


  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [textHistory, isLoading.text, error.text]);

  const resetStateForTab = (tab: 'text' | 'voice' | 'image' | 'facialAnalysis') => {
    setIsLoading(prev => ({ ...prev, [tab]: false }));
    setError(prev => ({ ...prev, [tab]: null }));
    if (tab === 'voice') setAiVoiceResponse(null);
    if (tab === 'image') setAiImageResponse(null);
    if (tab === 'facialAnalysis') {
      setFacialAnalysisResult(null);
    }
  };

  const handleTabChange = (value: string) => {
    const newTab = value as 'text' | 'voice' | 'image';
    setActiveTab(newTab);
  }

  const handleTextSubmit = async () => {
    if (!textQuery.trim()) {
      toast({ title: 'Error', description: 'Please enter a query.', variant: 'destructive' });
      return;
    }

    setError(prev => ({ ...prev, text: null }));
    setIsLoading(prev => ({ ...prev, text: true }));

    const currentConversationHistory: ConversationTurn[] = textHistory.map(entry => ({
      user: entry.user,
      assistant: entry.assistant.text || "",
    }));

    try {
      const input: ProcessTextQueryInput = { query: textQuery, history: currentConversationHistory };
      const result: ProcessTextQueryOutput = await processTextQuery(input);

      const newAssistantMessage: AiMessage = { text: result.answer };
      // Simulate chart data based on keywords - this logic can be refined or moved to AI
      if (result.answer.toLowerCase().includes("population") || result.answer.toLowerCase().includes("statistics") || result.answer.toLowerCase().includes("data for")) {
        newAssistantMessage.chartData = [
            { name: 'Set A', value: Math.floor(Math.random() * 800) + 200 },
            { name: 'Set B', value: Math.floor(Math.random() * 800) + 200 },
            { name: 'Set C', value: Math.floor(Math.random() * 800) + 200 },
            { name: 'Set D', value: Math.floor(Math.random() * 800) + 200 },
        ];
      }
      setTextHistory(prev => [...prev, { user: textQuery, assistant: newAssistantMessage }]);
      setTextQuery('');
    } catch (e: any) {
      setError(prev => ({ ...prev, text: 'Failed to process text query. ' + e.message }));
      toast({ title: 'AI Error', description: e.message, variant: 'destructive' });
    }
    setIsLoading(prev => ({ ...prev, text: false }));
  };

  const startRecording = async () => {
    resetStateForTab('voice');
    audioChunksRef.current = [];
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            if (base64Audio) {
              await handleVoiceSubmit(base64Audio);
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        setError(prev => ({ ...prev, voice: 'Microphone access denied or not available. ' + err.message }));
        toast({ title: 'Microphone Error', description: 'Could not access microphone. ' + err.message, variant: 'destructive' });
      }
    } else {
      setError(prev => ({ ...prev, voice: 'Audio recording is not supported by your browser.'}));
      toast({ title: 'Browser Error', description: 'Audio recording not supported.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceSubmit = async (voiceDataUri: string) => {
    setIsLoading(prev => ({ ...prev, voice: true }));
    try {
      const input: ProcessVoiceQueryInput = { voiceDataUri };
      const result: ProcessVoiceQueryOutput = await processVoiceQuery(input);
      setAiVoiceResponse({ text: result.spokenResponse });
    } catch (e: any) {
      setError(prev => ({ ...prev, voice: 'Failed to process voice query. ' + e.message }));
      toast({ title: 'AI Error', description: e.message, variant: 'destructive' });
    }
    setIsLoading(prev => ({ ...prev, voice: false }));
  };

  const processImageFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageDataUri(reader.result as string);
    };
    reader.readAsDataURL(file);
    resetStateForTab('image'); 
    if (inputRefImage.current) {
      inputRefImage.current.value = ""; 
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImageDataUri(null);
    setImageQueryText(''); 
    if (inputRefImage.current) {
      inputRefImage.current.value = "";
    }
    resetStateForTab('image'); 
  };

  const handleImageSubmit = async () => {
    if (!imageDataUri) {
      toast({ title: 'Error', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    if (!imageQueryText.trim()) {
      toast({ title: 'Error', description: 'Please enter a query for the image.', variant: 'destructive' });
      return;
    }
    resetStateForTab('image');
    setIsLoading(prev => ({ ...prev, image: true }));
    try {
      const input: ProcessImageQueryInput = { imageDataUri, query: imageQueryText };
      const result: ProcessImageQueryOutput = await processImageQuery(input);
      setAiImageResponse({ text: result.answer, imageUrl: imageDataUri }); 
    } catch (e: any) {
      setError(prev => ({ ...prev, image: 'Failed to process image query. ' + e.message }));
      toast({ title: 'AI Error', description: e.message, variant: 'destructive' });
    }
    setIsLoading(prev => ({ ...prev, image: false }));
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoading['image']) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoading['image']) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    if (isLoading['image']) {
      toast({
        title: 'Processing...',
        description: 'Please wait for the current image query to complete.',
      });
      return;
    }

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please drop an image file (e.g., PNG, JPG).',
          variant: 'destructive',
        });
      }
    } else {
       toast({
          title: 'No File Dropped',
          description: 'Please drop an image file.',
          variant: 'destructive',
        });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied!', description: 'AI response copied to clipboard.' });
    }).catch(err => {
      toast({ title: 'Copy Failed', description: 'Could not copy text: ' + err, variant: 'destructive' });
    });
  };

  const requestCameraPermission = async () => {
    setError(prev => ({ ...prev, facialAnalysis: null }));
    setHasCameraPermission(null); 
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error: any) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setError(prev => ({ ...prev, facialAnalysis: 'Camera access was denied. Please enable it in your browser settings.' }));
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    } else {
      setHasCameraPermission(false);
      setError(prev => ({ ...prev, facialAnalysis: 'Camera access is not supported by your browser.' }));
      toast({
        variant: 'destructive',
        title: 'Camera Not Supported',
        description: 'Your browser does not support camera access.',
      });
    }
  };

  const handleToggleFacialAnalysis = async () => {
    if (isFacialAnalysisRunning) {
      setIsFacialAnalysisRunning(false);
      setFacialAnalysisResult(null);
      setIsLoading(prev => ({ ...prev, facialAnalysis: false }));
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setHasCameraPermission(null); 
      return;
    }

    resetStateForTab('facialAnalysis');
    if (hasCameraPermission === null || !hasCameraPermission) {
        await requestCameraPermission();
    }
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true); 
            if (videoRef.current) {
                videoRef.current.srcObject = stream; 
            }

            setIsFacialAnalysisRunning(true);
            setIsLoading(prev => ({ ...prev, facialAnalysis: true }));
            setFacialAnalysisResult("Analyzing expressions...");
            
            setTimeout(() => {
                const expressions = ["Neutral", "Happy", "Focused", "Slightly Confused", "Engaged"];
                const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
                setFacialAnalysisResult(`Simulated Dominant Expression: ${randomExpression}\nEngagement Level: High (Simulated)`);
                setIsLoading(prev => ({ ...prev, facialAnalysis: false }));
            }, 3000);

        } catch (error) { 
            setHasCameraPermission(false);
            setError(prev => ({ ...prev, facialAnalysis: 'Camera access is required to start analysis. Please enable it.' }));
            toast({
                variant: 'destructive',
                title: 'Camera Access Required',
                description: 'Failed to start analysis because camera access was not granted or camera is unavailable.',
            });
            setIsFacialAnalysisRunning(false); 
            setIsLoading(prev => ({ ...prev, facialAnalysis: false })); 
        }
    }
  };


  const renderAiMessageCard = (message: AiMessage, messageKey?: string | number, isHistory: boolean = true) => {
    return (
      <Card key={messageKey} className={cn("max-w-xl bg-card/90 border-primary/50 shadow-lg backdrop-blur-sm", isHistory ? "" : "mt-6")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
          <div className="flex items-center gap-3">
            <Avatar className={cn("border-2 border-primary/50", isHistory ? "h-8 w-8" : "h-10 w-10")}>
              <AvatarImage src="https://placehold.co/100x100.png" alt="EduAI Avatar" data-ai-hint="bot character" />
              <AvatarFallback><Bot className={cn("text-primary", isHistory ? "h-4 w-4" : "h-5 w-5")} /></AvatarFallback>
            </Avatar>
            <CardTitle className={cn("font-headline text-primary", isHistory ? "text-base" : "text-xl")}>
              EduAI&apos;s Insight
            </CardTitle>
          </div>
          {message.text && (
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(message.text!)} title="Copy response" className={isHistory ? "h-8 w-8" : "h-10 w-10"}>
              <Copy className={cn("text-muted-foreground hover:text-primary", isHistory ? "h-4 w-4" : "h-5 w-5")} />
            </Button>
          )}
        </CardHeader>
        <CardContent className={cn("space-y-3 pt-2 pb-3 px-4", isHistory ? "text-sm" : "text-base")}>
          {message.imageUrl && activeTab === 'image' && ( 
            <div className="mb-3 p-3 border rounded-lg bg-secondary/40 shadow-inner">
              <h3 className="text-sm font-semibold mb-2 font-headline text-primary/90">Your Queried Image:</h3>
              <div className="flex justify-center">
                <Image src={message.imageUrl} alt="Queried Image" width={200} height={200} className="rounded-lg object-contain max-h-52 shadow-md border border-border" data-ai-hint="queried visual"/>
              </div>
            </div>
          )}
          {message.text && <p className="text-foreground leading-relaxed whitespace-pre-wrap p-3 bg-secondary/20 rounded-md border border-border shadow-sm">{message.text}</p>}
          {message.chartData && (
            <div className="mt-3 p-3 border rounded-lg bg-secondary/40 shadow-inner">
              <h3 className="text-sm font-semibold mb-2 font-headline text-primary/90 flex items-center gap-2"><BarChartBig className="h-4 w-4" /> Visual Aid:</h3>
              <ResponsiveContainer width="100%" height={isHistory ? 250 : 300}>
                <RechartsBarChart data={message.chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--foreground))" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem', boxShadow: '0 4px 6px hsla(0, 0%, 0%, 0.1)', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))'}}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                     {message.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const renderResponseForVoiceOrImage = (tab: 'voice' | 'image') => {
    const currentResponse = tab === 'voice' ? aiVoiceResponse : aiImageResponse;
    if (isLoading[tab]) {
      return (
        <Card className="mt-6 shadow-md border-none bg-transparent">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-3 min-h-[200px]">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-lg font-medium text-primary">EduAI is thinking...</p>
            <p className="text-sm text-muted-foreground">Please wait while we process your query.</p>
          </CardContent>
        </Card>
      );
    }

    if (error[tab]) {
      return (
         <Card className="mt-6 border-destructive shadow-md bg-destructive/10">
          <CardHeader>
            <CardTitle className="font-headline text-destructive flex items-center gap-2">
              <AlertTriangle /> Error Processing Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error[tab]}</p>
          </CardContent>
        </Card>
      );
    }

    if (currentResponse) {
      return renderAiMessageCard(currentResponse, `${tab}-response`, false);
    }

    return (
      <div className="mt-6 p-6 text-center text-muted-foreground min-h-[100px] flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-lg bg-secondary/10">
        <BookOpen className="h-10 w-10 mb-3 text-primary/50"/>
        <p className="font-medium text-primary/70">Your AI insights will appear here.</p>
        <p className="text-sm">Submit a query to get started.</p>
      </div>
    );
  };


  return (
    <div className="space-y-10 pb-16">
      <header className="text-center space-y-3 pt-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight bg-gradient-to-r from-primary via-sky-400 to-cyan-300 text-transparent bg-clip-text">
          EduAI Learning Assistant
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Welcome, Student! Explore knowledge interactively. Choose your method to ask questions and learn with AI.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 md:w-auto md:inline-flex mx-auto mb-10 shadow-lg rounded-lg p-1.5 bg-secondary/30 backdrop-blur-sm">
          <TabsTrigger value="text" className="gap-2 text-sm md:text-base py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all duration-200 ease-out"><FileText className="h-5 w-5" /> Text Query</TabsTrigger>
          <TabsTrigger value="voice" className="gap-2 text-sm md:text-base py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all duration-200 ease-out"><Mic className="h-5 w-5" /> Voice Query</TabsTrigger>
          <TabsTrigger value="image" className="gap-2 text-sm md:text-base py-3 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md transition-all duration-200 ease-out"><ImageIcon className="h-5 w-5" /> Image Query</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-2">
          <Card className="shadow-xl border-primary/30 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><Brain className="h-7 w-7"/>Ask with Text</CardTitle>
              <CardDescription>Type your question below. EduAI will remember the context of this conversation to provide better answers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div ref={chatContainerRef} className="space-y-4 mb-1 max-h-[50vh] overflow-y-auto p-4 rounded-md bg-background/30 border border-border shadow-inner">
                {textHistory.map((entry, index) => (
                  <React.Fragment key={index}>
                    <div className="flex justify-end">
                      <Card className="max-w-xl bg-primary/10 border-primary/30 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2 pt-3 px-4">
                           <Avatar className="h-8 w-8 border-2 border-primary/30">
                             <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar"/>
                             <AvatarFallback><User className="h-4 w-4 text-primary/80" /></AvatarFallback>
                           </Avatar>
                          <CardTitle className="text-sm font-semibold text-primary/90">You</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-foreground/90 pb-3 px-4 whitespace-pre-wrap">
                          {entry.user}
                        </CardContent>
                      </Card>
                    </div>
                    <div className="flex justify-start">
                       {renderAiMessageCard(entry.assistant, `history-${index}`)}
                    </div>
                  </React.Fragment>
                ))}
                {isLoading.text && (
                  <div className="flex justify-start">
                      <Card className="shadow-md border-none bg-transparent">
                        <CardContent className="p-4 flex flex-row items-center justify-start space-x-3 min-h-[60px]">
                          <Avatar className="h-8 w-8 border-2 border-primary/50">
                            <AvatarImage src="https://placehold.co/100x100.png" alt="EduAI Avatar" data-ai-hint="bot character"/>
                            <AvatarFallback><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                          </Avatar>
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                          <p className="text-sm font-medium text-primary">EduAI is thinking...</p>
                        </CardContent>
                      </Card>
                  </div>
                )}
                 {error.text && !isLoading.text && ( 
                  <div className="flex justify-start">
                       <Card className="border-destructive shadow-md bg-destructive/10 max-w-xl">
                        <CardHeader  className="pb-2 pt-3 px-4">
                          <CardTitle className="font-headline text-destructive flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4" /> Error
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-destructive-foreground pb-3 px-4 text-sm whitespace-pre-wrap">
                          {error.text}
                        </CardContent>
                      </Card>
                  </div>
                )}
                {textHistory.length === 0 && !isLoading.text && !error.text && (
                  <div className="py-10 text-center text-muted-foreground min-h-[100px] flex flex-col items-center justify-center">
                    <BookOpen className="h-10 w-10 mb-3 text-primary/50"/>
                    <p className="font-medium text-primary/70">Your conversation will appear here.</p>
                    <p className="text-sm">Ask a question to get started!</p>
                  </div>
                )}
              </div>
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="E.g., Explain the theory of relativity..."
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit();
                    }
                  }}
                  rows={1}
                  disabled={isLoading['text']}
                  className="text-base focus:ring-primary/80 bg-background shadow-inner rounded-md flex-grow resize-none min-h-[40px]"
                />
                <Button onClick={handleTextSubmit} disabled={isLoading['text']} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md h-10 px-4 py-2 transition-transform hover:scale-105">
                  {isLoading['text'] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  <span className="sr-only">Submit Query</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="mt-2">
          <Card className="shadow-xl border-primary/30 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><Mic className="h-7 w-7"/>Ask with Voice</CardTitle>
              <CardDescription>Record your question. EduAI will transcribe and respond.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 py-8">
              {!isRecording ? (
                <Button onClick={startRecording} disabled={isLoading['voice']} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-64 h-16 text-lg shadow-md py-3 transition-transform hover:scale-105">
                  <Mic className="mr-3 h-7 w-7" /> Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} disabled={isLoading['voice'] && !isRecording} size="lg" variant="destructive" className="w-64 h-16 text-lg shadow-md py-3">
                  <Mic className="mr-3 h-7 w-7 animate-pulse text-red-200" /> Stop Recording
                </Button>
              )}
              {isRecording && <p className="text-md text-muted-foreground animate-pulse">Recording... Speak clearly.</p>}
              {!isRecording && audioChunksRef.current.length > 0 && !isLoading['voice'] && aiVoiceResponse === null && error['voice'] === null && (
                <p className="text-sm text-green-600 font-medium">Recording complete. Processing your audio...</p>
              )}
            </CardContent>
          </Card>
          {renderResponseForVoiceOrImage('voice')}
        </TabsContent>

        <TabsContent value="image" className="mt-2">
          <Card className="shadow-xl border-primary/30 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2"><ImageIcon className="h-7 w-7"/>Ask About an Image</CardTitle>
              <CardDescription>Upload an image and ask a question related to its content. Drag & drop or click to browse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "p-8 border-2 border-dashed rounded-lg text-center transition-colors duration-200 ease-in-out",
                  isLoading['image'] ? "cursor-not-allowed bg-secondary/20 border-border" : "cursor-pointer hover:border-primary/70",
                  isDraggingOver && !isLoading['image'] ? "border-primary bg-primary/10" : "border-border"
                )}
                onClick={() => !isLoading['image'] && inputRefImage.current?.click()}
              >
                <Input
                  ref={inputRefImage}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isLoading['image']}
                  className="hidden"
                />
                {isDraggingOver && !isLoading['image'] ? (
                  <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                    <UploadCloud className="h-16 w-16 text-primary animate-bounce" />
                    <p className="text-xl font-semibold text-primary">Drop Your Image Here</p>
                    <p className="text-sm text-muted-foreground">Release to upload</p>
                  </div>
                ) : imageDataUri ? (
                  <div className="flex flex-col items-center relative">
                    <Image src={imageDataUri} alt="Uploaded preview" width={200} height={200} className="rounded-lg object-contain max-h-60 shadow-md border border-border" data-ai-hint="uploaded visual"/>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); clearImageSelection(); }}
                      className="absolute -top-2 -right-2 bg-card hover:bg-secondary rounded-full p-1 shadow-md"
                      title="Clear image"
                      disabled={isLoading['image']}
                    >
                      <XCircle className="h-6 w-6 text-destructive/80 hover:text-destructive" />
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">Image selected. Add your query below.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                    <UploadCloud className="h-16 w-16 text-muted-foreground/70" />
                    <p className="text-lg font-medium text-foreground">
                      Drag & drop an image, or <span className="font-semibold text-primary">click to browse</span>
                    </p>
                    <p className="text-sm text-muted-foreground">Supports common image formats (PNG, JPG, GIF, etc.)</p>
                  </div>
                )}
              </div>
              <Textarea
                placeholder="E.g., What type of architecture is shown here? or Describe the main elements in this artwork."
                value={imageQueryText}
                onChange={(e) => setImageQueryText(e.target.value)}
                rows={4}
                disabled={isLoading['image'] || !imageFile}
                className="text-base focus:ring-primary/80 bg-background shadow-inner rounded-md"
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleImageSubmit} disabled={isLoading['image'] || !imageFile} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md py-3 transition-transform hover:scale-105">
                {isLoading['image'] ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Submit Image Query
              </Button>
            </CardFooter>
          </Card>
          {renderResponseForVoiceOrImage('image')}
        </TabsContent>
      </Tabs>

      <Card className="mt-16 bg-gradient-to-br from-secondary/20 via-background/30 to-secondary/20 border-primary/20 shadow-xl max-w-4xl mx-auto backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3 text-primary/90 text-2xl">
            <Activity className="h-7 w-7" /> Student Engagement Insights
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            This advanced analytics module is under development. Educators will gain valuable insights into student interaction patterns, learning progress, and (with consent) even simulated facial expression analysis for nuanced feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg shadow border border-primary/20">
              <BarChartBig className="h-10 w-10 text-primary/70 mb-2" />
              <h3 className="font-semibold text-primary/80 mb-1">Detailed Metrics</h3>
              <p className="text-xs text-muted-foreground text-center">Track query types, response times, and topic frequency.</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg shadow border border-primary/20">
              <TrendingUp className="h-10 w-10 text-primary/70 mb-2" />
              <h3 className="font-semibold text-primary/80 mb-1">Trend Analysis</h3>
              <p className="text-xs text-muted-foreground text-center">Observe learning patterns and common questions over time.</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg shadow border border-primary/20">
              <Smile className="h-10 w-10 text-primary/70 mb-2" />
              <h3 className="font-semibold text-primary/80 mb-1">Expression Feedback</h3>
              <p className="text-xs text-muted-foreground text-center">Conceptual facial analysis for engagement cues (demo below).</p>
            </div>
          </div>
           <Alert variant="default" className="bg-background/80 border-primary/30 shadow">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            <AlertTitle className="font-semibold text-primary">Advanced Features: Coming Soon!</AlertTitle>
            <AlertDescription className="text-muted-foreground">
             The features above are conceptual. Full implementation would involve robust backend processing and AI models.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="mt-10 bg-card/70 backdrop-blur-sm border-primary/30 shadow-xl max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3 text-primary text-2xl">
            <VideoIcon className="h-7 w-7" /> Facial Expression Analysis (Concept Demo)
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            This is a conceptual demonstration. With user consent, this feature could analyze expressions to provide engagement feedback. No data is recorded or sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden shadow-inner border border-border flex items-center justify-center">
            <video ref={videoRef} className={cn("w-full h-full object-cover", {"hidden": !isFacialAnalysisRunning || !hasCameraPermission})} autoPlay muted playsInline />
            {(!isFacialAnalysisRunning || !hasCameraPermission) && (
              <div className="text-center text-muted-foreground p-4">
                <CameraOff className="h-16 w-16 mx-auto mb-2 text-primary/40" />
                <p>Camera feed will appear here when analysis starts and permission is granted.</p>
              </div>
            )}
          </div>

          {hasCameraPermission === false && ( 
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Facial analysis requires camera access. Please enable camera permissions in your browser settings and click "Start Analysis" again.
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleToggleFacialAnalysis} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-transform hover:scale-105">
            {isLoading.facialAnalysis ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : isFacialAnalysisRunning ? (
              <VideoIcon className="mr-2 h-5 w-5" /> 
            ) : (
              <VideoIcon className="mr-2 h-5 w-5" />
            )}
            {isLoading.facialAnalysis ? 'Processing...' : isFacialAnalysisRunning ? 'Stop Analysis' : 'Start Camera & Analysis (Simulated)'}
          </Button>

          {isFacialAnalysisRunning && isLoading.facialAnalysis && ( 
            <div className="text-center p-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Simulating expression analysis...</p>
            </div>
          )}

          {error.facialAnalysis && !isLoading.facialAnalysis && ( 
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>{error.facialAnalysis}</AlertDescription>
            </Alert>
          )}

          {facialAnalysisResult && !isLoading.facialAnalysis && ( 
            <Card className="mt-4 bg-secondary/30">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-lg font-headline text-primary/90">Simulated Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">
                {facialAnalysisResult}
              </CardContent>
            </Card>
          )}
        </CardContent>
         <CardFooter>
             <p className="text-xs text-muted-foreground">
                This demo uses your local camera if permission is granted but does not record, store, or transmit any video or image data. All processing is simulated client-side.
             </p>
         </CardFooter>
      </Card>
    </div>
  );
}
