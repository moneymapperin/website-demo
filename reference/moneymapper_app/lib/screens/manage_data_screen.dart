import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

class ManageDataScreen extends StatefulWidget {
  const ManageDataScreen({super.key});

  @override
  State<ManageDataScreen> createState() => _ManageDataScreenState();
}

class _ManageDataScreenState extends State<ManageDataScreen> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  bool _isSubmitting = false;
  Map<String, dynamic>? _activeRequest;

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchRequest();
  }

  Future<void> _fetchRequest() async {
    setState(() => _isLoading = true);
    final req = await _api.getActiveDeletionRequest();
    if (mounted) {
      setState(() {
        _activeRequest = req;
        _isLoading = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_firstNameController.text.trim().isEmpty || 
        _lastNameController.text.trim().isEmpty || 
        _emailController.text.trim().isEmpty || 
        _phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }
    
    if (_reasonController.text.trim().length < 20) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reason must be at least 20 characters long')));
      return;
    }

    // First Warning
    bool? proceed1 = await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Warning'),
        content: const Text('You understand after requesting data deletion you will not be able to use our app after data is deleted, and if you want to use it again you will have to register again.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('I Understand')),
        ],
      ),
    );
    if (proceed1 != true) return;

    // Second Warning
    bool? proceed2 = await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Final Confirmation', style: TextStyle(color: Colors.red)),
        content: const Text('Are you ready to lose track of your financial health permanently?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true), 
            child: const Text('Yes, Delete My Data', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (proceed2 != true) return;

    setState(() => _isSubmitting = true);
    try {
      await _api.submitDeletionRequest({
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'reason': _reasonController.text.trim(),
      });
      
      if (mounted) {
        await AuthService().signOut();
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (r) => false
        );
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Data deletion requested. Logging out...')));
      }
    } catch(e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _withdraw() async {
    setState(() => _isSubmitting = true);
    try {
      await _api.withdrawDeletionRequest();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deletion request withdrawn successfully.')));
        _fetchRequest();
      }
    } catch(e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      appBar: AppBar(
        title: const Text('Manage My Data', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _activeRequest != null ? _buildActiveRequestView(isDark) : _buildFormView(isDark),
          ),
    );
  }

  Widget _buildActiveRequestView(bool isDark) {
    final scheduledDate = _activeRequest!['scheduled_for'] != null 
        ? DateTime.parse(_activeRequest!['scheduled_for'].toString()).toLocal().toString().split(' ')[0]
        : 'in 7 days';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.warning, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(Icons.warning_rounded, color: AppColors.warning, size: 48),
          const SizedBox(height: 16),
          const Text('Deletion Scheduled', textAlign: TextAlign.center, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(
            'Your account and all associated data is scheduled to be permanently deleted on $scheduledDate.\n\nIf you change your mind, you can withdraw this request before the scheduled date.',
            textAlign: TextAlign.center,
            style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, height: 1.5),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _withdraw,
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: _isSubmitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Withdraw Deletion Request'),
          ),
        ],
      ),
    );
  }

  Widget _buildFormView(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Request Data Deletion', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black)),
        const SizedBox(height: 12),
        Text('Submit a request to permanently delete your account and all associated financial data. This process takes 7 days to complete.', 
            style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, height: 1.5)),
        const SizedBox(height: 32),
        
        _buildTextField('First Name', _firstNameController, Icons.person_outline),
        const SizedBox(height: 16),
        _buildTextField('Last Name', _lastNameController, Icons.person_outline),
        const SizedBox(height: 16),
        _buildTextField('Email Address', _emailController, Icons.email_outlined, TextInputType.emailAddress),
        const SizedBox(height: 16),
        _buildTextField('Mobile Number', _phoneController, Icons.phone_android_outlined, TextInputType.phone),
        const SizedBox(height: 16),
        
        TextField(
          controller: _reasonController,
          maxLines: 4,
          style: TextStyle(color: isDark ? Colors.white : Colors.black),
          decoration: const InputDecoration(
            labelText: 'Reason for deletion (Min 20 chars)',
            alignLabelWithHint: true,
          ),
        ),
        
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger,
            padding: const EdgeInsets.symmetric(vertical: 16)
          ),
          child: _isSubmitting 
              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
              : const Text('Request Deletion', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, [TextInputType? type]) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextField(
      controller: controller,
      keyboardType: type,
      style: TextStyle(color: isDark ? Colors.white : Colors.black),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
      ),
    );
  }
}
