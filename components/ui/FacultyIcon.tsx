import {
  Microscope, Cpu, Stethoscope, Globe, BookOpen, Briefcase,
  Gavel, GraduationCap, Wheat, Leaf, Database, LucideProps,
} from "lucide-react";

const MAP: Record<string, React.FC<LucideProps>> = {
  Microscope, Cpu, Stethoscope, Globe, BookOpen, Briefcase,
  Gavel, GraduationCap, Wheat, Leaf, Database,
};

export function FacultyIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = MAP[name] || BookOpen;
  return <Icon {...props} />;
}
