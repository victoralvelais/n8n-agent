export interface FormField {
  label?: string;
  type?: string;
  name?: string | null;
  id?: string | null;
  placeholder?: string | null;
  required?: boolean;
  selector?: string;
  options?: Array<{ value: string; label: string }>;
}
