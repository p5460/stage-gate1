"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Phone, Mail, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/back-button";

export default function ContactSupportPage() {
  const [isPending, startTransition] = useTransition();
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium" as const,
  });

  const handleSubmitTicket = () => {
    if (
      !ticketForm.subject ||
      !ticketForm.description ||
      !ticketForm.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        // In a real app, this would submit the support ticket
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("Support ticket submitted successfully");
        setTicketForm({
          subject: "",
          description: "",
          category: "",
          priority: "medium",
        });
      } catch (error) {
        toast.error("Failed to submit support ticket");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Contact Support</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Need help? Our support team is here to assist you with any
              questions or issues.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Methods */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Phone Support</div>
                      <div className="text-sm text-gray-600">
                        +27 12 841 2911
                      </div>
                      <div className="text-xs text-gray-500">
                        Mon-Fri, 08:00-17:00
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Email Support</div>
                      <div className="text-sm text-gray-600">
                        support@csir.co.za
                      </div>
                      <div className="text-xs text-gray-500">
                        Response within 24 hours
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Support Tickets</div>
                      <div className="text-sm text-gray-600">
                        Submit detailed requests
                      </div>
                      <div className="text-xs text-gray-500">
                        Track progress online
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded">
                      <Phone className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">Emergency Hotline</div>
                      <div className="text-sm text-gray-600">
                        +27 12 841 9999
                      </div>
                      <div className="text-xs text-gray-500">
                        Critical issues only, 24/7
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Technical Support
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>08:00 - 17:00 (Mon-Fri)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Process Support</span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>08:00 - 17:00 (Mon-Fri)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Emergency Support
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>24/7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Support Form */}
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={ticketForm.subject}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, subject: e.target.value })
                    }
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={ticketForm.category}
                    onValueChange={(value) =>
                      setTicketForm({ ...ticketForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="account">Account Problem</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="training">Training Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={ticketForm.priority}
                    onValueChange={(value: any) =>
                      setTicketForm({ ...ticketForm, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={ticketForm.description}
                    onChange={(e) =>
                      setTicketForm({
                        ...ticketForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Provide detailed information about your issue..."
                    rows={6}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitTicket}
                  disabled={isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isPending ? "Submitting..." : "Submit Support Request"}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our support terms and
                  conditions. We'll respond to your request within 24 hours
                  during business days.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">
                    How quickly will I get a response?
                  </h4>
                  <p className="text-sm text-gray-600">
                    We aim to respond to all support requests within 24 hours
                    during business days. Urgent issues are prioritized and
                    typically receive a response within 4 hours.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    What information should I include?
                  </h4>
                  <p className="text-sm text-gray-600">
                    Please provide as much detail as possible, including steps
                    to reproduce the issue, error messages, and screenshots if
                    applicable.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    Can I track my support request?
                  </h4>
                  <p className="text-sm text-gray-600">
                    Yes, once submitted, you'll receive a ticket number via
                    email that you can use to track the progress of your
                    request.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    What if I have an emergency?
                  </h4>
                  <p className="text-sm text-gray-600">
                    For critical system issues that affect multiple users,
                    please call our emergency hotline at +27 12 841 9999
                    (available 24/7).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
