import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";

interface CollaborationInviteProps {
  businessId: string;
  businessName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CollaborationInvite({ businessId, businessName, onClose, onSuccess }: CollaborationInviteProps) {
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { businessId: string; inviteeEmail: string; message?: string }) => {
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        throw new Error("You must be logged in to send invitations");
      }

      const response = await fetch("/api/collaborations/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          inviterId: currentUser.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations'] });
      toast({
        title: "Invitation Sent",
        description: "Collaboration invitation has been sent successfully.",
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Error sending invitation:", error);
      toast({
        title: "Failed to Send Invitation",
        description: error.message || "Failed to send collaboration invitation.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter the email address of the person you want to invite.",
        variant: "destructive",
      });
      return;
    }

    sendInvitationMutation.mutate({
      businessId,
      inviteeEmail: inviteeEmail.trim(),
      message: message.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <CardTitle>Invite Collaborator</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Business</Label>
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                {businessName}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteeEmail">Email Address *</Label>
              <Input
                id="inviteeEmail"
                type="email"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
                placeholder="Enter collaborator's email"
                required
              />
              <p className="text-sm text-slate-600">
                The person must have an account on this platform
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={sendInvitationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={sendInvitationMutation.isPending || !inviteeEmail.trim()}
              >
                {sendInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
