import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class BrandingUtils {
  static const String _logoToken = 'pk_fnVjREavSpOqt3dwLKJDbg';

  static const Map<String, String> _domainMap = {
    // Banks & Financials
    'hdfcbank': 'hdfcbank.com',
    'hdfc': 'hdfc.com',
    'sbi': 'sbi.co.in',
    'sbin': 'sbi.co.in',
    'icici': 'icicibank.com',
    'axis': 'axisbank.com',
    'kotak': 'kotak.com',
    'pnbindia': 'pnbindia.in',
    'bob': 'bankofbaroda.in',
    'canara': 'canarabank.com',
    'canbk': 'canarabank.com',
    'idfc': 'idfcfirstbank.com',
    'idfcfirst': 'idfcfirstbank.com',
    'yesbank': 'yesbank.in',
    'yesbk': 'yesbank.in',
    'indusind': 'indusind.com',
    'indusindbk': 'indusind.com',
    'rbl': 'rblbank.com',
    'bandhan': 'bandhanbank.com',

    // Stock Tickers & Large Caps
    'reliance': 'reliance.com',
    'tcs': 'tcs.com',
    'infy': 'infosys.com',
    'infosys': 'infosys.com',
    'itc': 'itcportal.com',
    'bhartiartl': 'airtel.in',
    'airtel': 'airtel.in',
    'bajfinance': 'bajajfinserv.in',
    'bajajfinsv': 'bajajfinserv.in',
    'larsentoubro': 'larsentoubro.com',
    'asnpaint': 'asianpaints.com',
    'maruti': 'marutisuzuki.com',
    'titan': 'titan.co.in',
    'hindalco': 'hindalco.com',
    'tatasteel': 'tatasteel.com',
    'tatamotors': 'tatamotors.com',
    'tataconsum': 'tataconsumer.com',
    'tatapower': 'tatapower.com',
    'tata': 'tata.com',
    'birla': 'adityabirla.com',
    'mahindra': 'mahindra.com',
    'adani': 'adani.com',
    'jsw': 'jsw.in',
    'vedanta': 'vedantalimited.com',
    'sunpharma': 'sunpharma.com',
    'cipla': 'cipla.com',
    'drreddy': 'drreddys.com',
    'divislab': 'divislabs.com',
    'apollohosp': 'apollohospitals.com',
    'hul': 'hul.co.in',
    'nestleind': 'nestle.in',
    'britannia': 'britannia.co.in',
    'coalindia': 'coalindia.in',
    'ntpc': 'ntpc.co.in',
    'ongc': 'ongcindia.com',
    'pfc': 'pfcindia.com',
    'recltd': 'recindia.nic.in',
    'gail': 'gailonline.com',
    'ioc': 'iocl.com',
    'bpcl': 'bharatpetroleum.in',
    'hpcl': 'hindustampetroleum.com',
    'zomato': 'zomato.com',
    'paytm': 'paytm.com',
    'nykaa': 'fsn.in',
    'powergrid': 'powergrid.in',
    'bajajauto': 'bajajauto.com',
    'heromotoco': 'heromotocorp.com',
    'eichermot': 'eicher.in',
    'grasim': 'grasim.com',
    'ultratech': 'ultratechcement.com',
    'shreecem': 'shreecement.com',
    'techm': 'techmahindra.com',
    'wipro': 'wipro.com',
    'hcltech': 'hcltech.com',
    'mrftyres': 'mrf.com',
    'pidilitind': 'pidilite.com',
    'siemens': 'siemens.com',
    'abb': 'abb.com',
    'havells': 'havells.com',
    'voltas': 'voltas.com',
    'trent': 'trentlimited.com',
    'bhel': 'bhel.in',
    'bel': 'bel-india.in',
    'hal': 'hal-india.co.in',
    'mazagondoc': 'mazagondock.in',
    'rvnl': 'rvnl.org',
    'irfc': 'irfc.co.in',
    'concor': 'concorindia.co.in',
    'ltim': 'ltimindtree.com',
    'ltimindtree': 'ltimindtree.com',
    'oil': 'oil-india.com',
    'ireda': 'ireda.in',
    'nhpc': 'nhpcindia.com',
    'sjvn': 'sjvn.nic.in',
    'unionbank': 'unionbankofindia.co.in',
    'indianb': 'indianbank.in',
    'idbi': 'idbi.com',
    'federalbnk': 'federalbank.co.in',
    'aubank': 'aubank.in',
    'karurvysya': 'kvb.co.in',
    'southbank': 'southindianbank.com',
    'csbbank': 'csb.co.in',
    'dcbbank': 'dcbbank.com',
    'equitas': 'equitasbank.com',
    'uujjivan': 'ujjivansfb.in',

    // Insurance
    'lic': 'licindia.in',
    'niva': 'nivabupa.com',
    'star': 'starhealth.in',
    'care': 'careinsurance.com',
    'max': 'maxlifeinsurance.com',
    'hdfclife': 'hdfclife.com',
    'icicipru': 'iciciprulife.com',
    'sbilife': 'sbilife.co.in',

    // AMCs (Mutual Funds)
    'miraeasset': 'miraeassetmf.co.in',
    'mirae': 'miraeassetmf.co.in',
    'nippon': 'nipponindiaim.com',
    'dsp': 'dspim.com',
    'quant': 'quantmutual.com',
    'ppfas': 'amc.ppfas.com',
    'motilal': 'motilaloswalmf.com',
    'edelweiss': 'edelweissmf.com',
    'uti': 'utimf.com',
    'franklin': 'franklintempletonindia.com',
  };

  static String? getLogoUrl(String name) {
    String cleanName = name.toLowerCase().trim()
        .replaceAll('limited', '')
        .replaceAll('ltd', '')
        .replaceAll('pvt', '')
        .replaceAll('india', '')
        .replaceAll('.ns', '')
        .replaceAll('.bo', '')
        .replaceAll('nse:', '')
        .replaceAll('bse:', '')
        .replaceAll(' ', '')
        .replaceAll('&', '');

    // Sort keys by length (longest first) to avoid false positives
    final sortedKeys = _domainMap.keys.toList()
      ..sort((a, b) => b.length.compareTo(a.length));

    for (final key in sortedKeys) {
      if (cleanName.contains(key)) {
        return "https://img.logo.dev/${_domainMap[key]}?token=$_logoToken";
      }
    }

    // Default fallback for stocks: try ticker.com
    if (name.length >= 3 && name.length <= 10 && !name.contains(' ')) {
      return "https://img.logo.dev/${name.toLowerCase()}.com?token=$_logoToken";
    }

    return null;
  }

  static Color getRandomColor(String name) {
    final List<Color> colors = [
      Colors.blue, Colors.red, Colors.green, Colors.orange,
      Colors.purple, Colors.teal, Colors.indigo, Colors.pink
    ];
    return colors[name.length % colors.length];
  }
}

class BrandLogo extends StatelessWidget {
  final String name;
  final double size;

  const BrandLogo({
    super.key,
    required this.name,
    this.size = 40.0
  });

  @override
  Widget build(BuildContext context) {
    final logoUrl = BrandingUtils.getLogoUrl(name);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size * 0.25),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
        boxShadow: [
          if (!isDark) BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))
        ],
      ),
      padding: EdgeInsets.all(size * 0.15),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: logoUrl != null
            ? Image.network(
                logoUrl,
                fit: BoxFit.contain,
                filterQuality: FilterQuality.high,
                errorBuilder: (ctx, err, stack) => _buildGoogleFallback(),
                loadingBuilder: (ctx, child, progress) {
                  if (progress == null) return child;
                  return const Center(child: SizedBox(width: 10, height: 10, child: CircularProgressIndicator(strokeWidth: 2)));
                },
              )
            : _buildFallback(),
      ),
    );
  }

  Widget _buildGoogleFallback() {
    // Fallback to Google S2 API if Logo.dev fails
    final logoUrl = BrandingUtils.getLogoUrl(name);
    if (logoUrl == null) return _buildFallback();

    // Extract domain from logo.dev URL
    final uri = Uri.parse(logoUrl);
    final domain = uri.queryParameters['token'] != null
        ? uri.pathSegments.last
        : null;

    if (domain != null) {
      return Image.network(
        "https://www.google.com/s2/favicons?sz=128&domain=$domain",
        fit: BoxFit.contain,
        errorBuilder: (ctx, err, stack) => _buildFallback(),
      );
    }
    return _buildFallback();
  }

  Widget _buildFallback() {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final bgColor = BrandingUtils.getRandomColor(name);

    return Container(
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          color: bgColor,
          fontWeight: FontWeight.w900,
          fontSize: size * 0.45,
        ),
      ),
    );
  }
}
