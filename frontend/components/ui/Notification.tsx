// "use client";

// import { useEffect, useState } from "react";
// import { Notification as NotificationType } from "@/types/notification";

// interface NotificationProps {
//   notification: NotificationType;
//   onClose: (id: string) => void;
// }

// export function Notification({ notification, onClose }: NotificationProps) {
//   const [isVisible, setIsVisible] = useState(true);
//   const [isLeaving, setIsLeaving] = useState(false);

//   const handleClose = () => {
//     setIsLeaving(true);
//     setTimeout(() => {
//       setIsVisible(false);
//       onClose(notification.id);
//     }, 300);
//   };

//   useEffect(() => {
//     if (notification.duration && notification.duration > 0) {
//       const timer = setTimeout(() => {
//         handleClose();
//       }, notification.duration);
//       return () => clearTimeout(timer);
//     }
//   }, [notification.duration, notification.id]);

//   if (!isVisible) return null;

//   const getStyles = () => {
//     switch (notification.type) {
//       case "success":
//         return "bg-green-50 border-green-500 text-green-800";
//       case "error":
//         return "bg-red-50 border-red-500 text-red-800";
//       case "warning":
//         return "bg-yellow-50 border-yellow-500 text-yellow-800";
//       case "info":
//         return "bg-blue-50 border-blue-500 text-blue-800";
//       default:
//         return "bg-gray-50 border-gray-500 text-gray-800";
//     }
//   };

//   const getIcon = () => {
//     switch (notification.type) {
//       case "success":
//         return "✓";
//       case "error":
//         return "✗";
//       case "warning":
//         return "⚠";
//       case "info":
//         return "ℹ";
//       default:
//         return "•";
//     }
//   };

//   return (
//     <div
//       className={`
//         mb-3 flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg
//         transition-all duration-300 transform
//         ${getStyles()}
//         ${isLeaving ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}
//       `}
//       role="alert"
//     >
//       <div className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 font-bold">
//         {getIcon()}
//       </div>
//       <div className="flex-1 text-sm font-medium">{notification.message}</div>
//       <button
//         onClick={handleClose}
//         className="text-current opacity-60 hover:opacity-100 transition-opacity"
//         aria-label="Close"
//       >
//         ×
//       </button>
//     </div>
//   );
// }
