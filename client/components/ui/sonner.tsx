import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: `
            group toast 
            bg-background text-foreground border-border shadow-lg 
            data-[type=success]:bg-green-600 data-[type=success]:text-white 
            data-[type=error]:bg-red-600 data-[type=error]:text-white 
            data-[type=warning]:bg-yellow-400 data-[type=warning]:text-white`,
          description:
            "group-[.toast]:text-muted-foreground group-[.toast[data-type=success]]:text-white/80 group-[.toast[data-type=error]]:text-white/80 group-[.toast[data-type=warning]]:text-white/80",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
