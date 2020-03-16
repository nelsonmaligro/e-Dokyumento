#include <stdio.h>

char *entity(int symbol)
{
	switch(symbol)
	{
		case 97:
			return("&alpha;");
		case 98:
			return("&beta;");
		case 99:
			return("&chi;");
		case 100:
			return("&delta;");
		case 101:
			return("&epsilon;");
		case 102:
			return("&phi;");
		case 103:
			return("&gamma;");
		case 109:
			return("&mu;");
		case 110:
			return("&nu;");
		case 111:
			return("&omicron;");
		case 112:
			return("&pi;");
		case 113:
			return("&theta;");
		case 114:
			return("&rho;");
		case 115:
			return("&sigma;");
		case 116:
			return("&tau;");
		case 117:
			return("&upsilon;");
		case 118:
			return("&omega1;");
		case 119:
			return("&omega;");
		case 120:
			return("&xi;");
		case 121:
			return("&psi;");
		case 122:
			return("&zeta;");
		case 177:
			return("&plusmn;");
		default:
			fprintf(stderr, "symbol %d missing in entity.c\n",
				symbol);
			return("&UnknownEntity;");
	}
}

