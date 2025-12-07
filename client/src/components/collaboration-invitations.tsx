import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Check, X, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";

interface CollaborationInvitationsProps {
  onInvitationResponded: () => void;
}

export default function CollaborationInvitations({ onInvitationResponded }: CollaborationInvitationsProps) {
  const user = authManager.getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's collaboration invitations
  const { data: invitationsData, isLoading } = useQuery({
    queryKey: ['/api/collaborations/invitations', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/collaborations/invitations/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json();
    },
    enabled: !!user,
  });

  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, action }: { invitationId: string; action: 'accept' | 'reject' }) => {
      const response = await fetch("/api/collaborations/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to respond to invitation");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/invitations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/user', user?.id, 'businesses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'all-businesses'] });
      
      const action = variables.action === 'accept' ? 'accepted' : 'rejected';
      toast({
        title: `Invitation ${action}`,
        description: `You have ${action} the collaboration invitation.`,
      });
      onInvitationResponded();
    },
    onError: (error) => {
      console.error("Error responding to invitation:", error);
      toast({
        title: "Failed to Respond",
        description: error.message || "Failed to respond to invitation.",
        variant: "destructive",
      });
    },
  });

  const invitations = invitationsData?.invitations || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaboration Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaboration Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No pending collaboration invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Collaboration Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation: any) => (
            <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Business Collaboration</h4>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    You've been invited to collaborate on a business
                  </p>
                  {invitation.message && (
                    <p className="text-sm text-slate-500 italic">
                      "{invitation.message}"
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => respondToInvitationMutation.mutate({ 
                    invitationId: invitation.id, 
                    action: 'accept' 
                  })}
                  disabled={respondToInvitationMutation.isPending}
                  className="flex-1"
                >
                  {respondToInvitationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToInvitationMutation.mutate({ 
                    invitationId: invitation.id, 
                    action: 'reject' 
                  })}
                  disabled={respondToInvitationMutation.isPending}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
