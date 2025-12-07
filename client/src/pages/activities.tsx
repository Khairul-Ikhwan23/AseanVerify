import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { Activity, QrCode, UserPlus, FileText, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { authManager } from "@/lib/auth";

export default function Activities() {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user) return null;

  // Mock data - in a real app, this would come from an API
  const activities = [
    {
      id: 1,
      type: 'profile_completed',
      title: 'Profile Completed',
      description: 'Your business profile has been completed successfully',
      timestamp: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      id: 2,
      type: 'qr_scan',
      title: 'QR Code Scanned',
      description: 'Connected with Tech Solutions Inc.',
      timestamp: '1 day ago',
      icon: QrCode,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'connection',
      title: 'New Connection',
      description: 'Added to your business network',
      timestamp: '2 days ago',
      icon: UserPlus,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      id: 4,
      type: 'document_upload',
      title: 'Document Uploaded',
      description: 'Registration certificate uploaded',
      timestamp: '3 days ago',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      id: 5,
      type: 'verification',
      title: 'Verification Started',
      description: 'Your profile is under review',
      timestamp: '1 week ago',
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="mr-4 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Recent Activities</h1>
          <p className="text-slate-600">Track your MSME Passport journey and business connections</p>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${activity.bgColor} rounded-full flex items-center justify-center`}>
                      <IconComponent className={`w-6 h-6 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">{activity.title}</h3>
                        <span className="text-sm text-slate-500">{activity.timestamp}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{activity.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State (if no activities) */}
        {activities.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Activities Yet</h3>
              <p className="text-slate-600">Your recent activities will appear here as you use your MSME Passport</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
