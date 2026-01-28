interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="bg-destructive/10 text-destructive px-4 py-2 flex items-center">
      {message}
    </div>
  );
}
