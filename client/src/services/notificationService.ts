import { feedManager } from '../components/BreakingFeed';

export const checkNotificationPermission = (): boolean => {
  return 'Notification' in window;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!checkNotificationPermission()) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options: NotificationOptions = {}): boolean => {
  try {
    if (options.data?.notification) {
      feedManager.addFeed(options.data.notification);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error showing breaking feed notification:', error);
    return false;
  }
};

export const subscribeToNotifications = (userId: number, onNotification: (data: any) => void): () => void => {
  const shownNotifications = new Set<number>();

  const storedShown = localStorage.getItem('shownNotifications');
  if (storedShown) {
    const parsed = JSON.parse(storedShown);
    parsed.forEach((id: number) => shownNotifications.add(id));
  }

  const getLastCheckTime = () => {
    const stored = localStorage.getItem('lastNotificationCheck');
    return stored ? new Date(stored) : new Date(Date.now() - 5 * 60 * 1000); 
  };

  let intervalId: number;

  try {
    intervalId = window.setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return; 

        const lastCheck = getLastCheckTime();

        const response = await fetch(`http://localhost:5000/api/announcements/me/new?since=${lastCheck.toISOString()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const newNotifications = data.filter((notification: any) => !shownNotifications.has(notification.id));

            if (newNotifications.length > 0) {
              onNotification(newNotifications);

              newNotifications.forEach((notification: any) => {
                shownNotifications.add(notification.id);
              });

              localStorage.setItem('shownNotifications', JSON.stringify(Array.from(shownNotifications)));
            }
          }
        }
      } catch (error) {
        console.error('Error checking for new notifications:', error);
      }
    }, 30000); 
  } catch (error) {
    console.error('Error setting up notification interval:', error);
    intervalId = 0;
  }

  return () => clearInterval(intervalId);
};
