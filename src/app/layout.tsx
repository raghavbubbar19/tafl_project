import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'TM Visualizer – Multi-Tape Turing Machine Simulator',
  description:
    'An interactive, production-grade visualizer for Multi-Tape and Multi-Head Turing Machines. Define machines, step through computations, and understand TM theory visually.',
  keywords: ['Turing Machine', 'simulator', 'multi-tape', 'automata', 'computer science', 'education'],
  openGraph: {
    title: 'TM Visualizer',
    description: 'Interactive Multi-Tape Turing Machine Simulator',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
