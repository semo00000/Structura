"use client";

import React, { useEffect, useState } from "react";
import { teams, APPWRITE_CONFIG } from "@/lib/appwrite";
import { useCompanySettings } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, Mail, Shield, User, Trash2 } from "lucide-react";
import { SubscriptionGate } from "@/components/SubscriptionGate";

type Membership = {
  $id: string;
  userName: string;
  userEmail: string;
  roles: string[];
  invited: string;
  joined: string;
  confirm: boolean;
};

export function TeamManagement() {
  const company = useCompanySettings();
  const { toast } = useToast();
  const [members, setMembers] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Commercial");

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      // We use company.id as the teamId
      const response = await teams.listMemberships(company.id);
      setMembers(response.memberships as unknown as Membership[]);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      // If team doesn't exist yet (demo), show empty
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [company.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      // Appwrite creates the membership and sends invite
      await teams.createMembership(
        company.id,
        [inviteRole],
        inviteEmail,
        undefined, // userId (auto-generated)
        undefined, // phone
        `${window.location.origin}/accept-invite`, // Redirect URL
        "" // name (optional)
      );

      toast({
        title: "Invitation envoyée",
        description: `Un e-mail d'invitation a été envoyé à ${inviteEmail}.`,
      });
      
      setInviteEmail("");
      fetchMembers();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'envoyer l'invitation.",
        variant: "error",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (membershipId: string) => {
    try {
      await teams.deleteMembership(company.id, membershipId);
      toast({
        title: "Membre supprimé",
        description: "L'accès a été révoqué avec succès.",
      });
      fetchMembers();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de supprimer le membre.",
        variant: "error",
      });
    }
  };

  return (
    <SubscriptionGate tier="Enterprise">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gouvernance & Membres</CardTitle>
            <CardDescription>
              Gérez les accès de votre équipe et définissez les rôles (Admin, Commercial, Magasinier, Caissier).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email du collaborateur</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="exemple@entreprise.ma" 
                    className="pl-10"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="w-full space-y-2 md:w-48">
                <Label htmlFor="role">Rôle</Label>
                <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "Commercial")}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Magasinier">Magasinier</SelectItem>
                    <SelectItem value="Caissier">Caissier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 size-4" />
                )}
                Inviter
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Écosystème Actif</CardTitle>
            <CardDescription>
              Liste des collaborateurs ayant accès à l'entité {company.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed text-center">
                <User className="mb-2 size-8 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground">Aucun membre pour le moment (Hormis le propriétaire).</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collaborateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.$id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{member.userName || "Invitation en attente"}</span>
                          <span className="text-xs text-muted-foreground">{member.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {member.roles.map((role) => (
                            <Badge key={role} variant="outline" className="bg-primary/5 text-[10px] uppercase tracking-wider">
                              <Shield className="mr-1 size-3" />
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.joined ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Actif</Badge>
                        ) : (
                          <Badge variant="outline" className="animate-pulse">En attente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeMember(member.$id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SubscriptionGate>
  );
}
