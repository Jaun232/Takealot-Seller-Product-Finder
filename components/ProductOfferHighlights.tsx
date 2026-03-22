import React from 'react';
import type { OfferHighlight, ProductOfferSummary } from '../types';
import ProductComparisonLinks from './ProductComparisonLinks';

interface ProductOfferHighlightsProps {
  summary: ProductOfferSummary;
}

const ProductOfferHighlights: React.FC<ProductOfferHighlightsProps> = ({ summary }) => {
  const { product, offers, message, meta } = summary;
  const sourcingAssessment = buildSourcingAssessment(summary);

  return (
    <section className="rounded-lg border border-gray-700 bg-gray-800/70 p-4 shadow-lg sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {product.imageUrl && (
            <img
              src={product.imageUrl.replace('{size}', '400')}
              alt={product.name}
              className="h-16 w-16 shrink-0 rounded-lg border border-gray-700 object-cover sm:h-20 sm:w-20"
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-wide text-gray-400">Matched product</p>
            <h2 className="break-words text-lg font-semibold text-brand-light sm:text-xl">{product.name}</h2>
            {product.subtitle && (
              <p className="mt-1 max-w-2xl break-words text-sm text-gray-400">{product.subtitle}</p>
            )}
            <p className="mt-1 break-words text-xs text-gray-500">Query: "{meta.query}"</p>
            {(product.brand || typeof product.starRating === 'number' || typeof product.reviewCount === 'number') && (
              <p className="text-xs text-gray-400 mt-1">
                {product.brand ? `Brand: ${product.brand}` : 'Brand unavailable'}
                {(typeof product.starRating === 'number' || typeof product.reviewCount === 'number') && ' | '}
                {typeof product.starRating === 'number'
                  ? `${product.starRating.toFixed(1)} stars`
                  : 'No product rating'}
                {typeof product.reviewCount === 'number'
                  ? ` from ${product.reviewCount.toLocaleString('en-ZA')} reviews`
                  : ''}
              </p>
            )}
            {product.sellerName && (
              <p className="text-xs text-gray-400 mt-1">
                Sold by{' '}
                {product.sellerLink ? (
                  <a
                    href={product.sellerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:underline"
                  >
                    {product.sellerName}
                  </a>
                ) : (
                  product.sellerName
                )}
              </p>
            )}
            {(typeof product.sellerRating === 'number' || typeof product.sellerReviewCount === 'number') && (
              <p className="text-xs text-gray-400 mt-1">
                Seller signal:{' '}
                {typeof product.sellerRating === 'number'
                  ? `${product.sellerRating.toFixed(1)} stars`
                  : 'No rating'}{' '}
                {typeof product.sellerReviewCount === 'number'
                  ? `from ${product.sellerReviewCount.toLocaleString('en-ZA')} reviews`
                  : ''}
              </p>
            )}
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-brand-cyan/60 px-4 py-2 text-sm font-medium text-brand-light whitespace-nowrap transition-colors hover:bg-brand-cyan/20"
          >
            View on Takealot
          </a>
          <a
            href={meta.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 whitespace-nowrap transition-colors hover:bg-gray-700"
          >
            View search page
          </a>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-yellow-300/90 bg-yellow-900/20 border border-yellow-700/60 rounded-md px-3 py-2">
          {message}
        </p>
      )}

      <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Sourcing Assessment</p>
            <h3 className="text-xl font-semibold text-brand-light mt-1">
              {sourcingAssessment.opportunityLabel}
            </h3>
            <p className="text-sm text-gray-400 mt-2 max-w-3xl">
              {sourcingAssessment.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ScorePill
              label="Opportunity"
              value={`${sourcingAssessment.opportunityScore}/100`}
              tone={sourcingAssessment.opportunityTone}
            />
            <ScorePill
              label="Confidence"
              value={sourcingAssessment.confidence}
              tone={sourcingAssessment.confidenceTone}
            />
            <ScorePill
              label="Market"
              value={sourcingAssessment.marketCompetition}
              tone={sourcingAssessment.marketTone}
            />
            <ScorePill
              label="Seller Strength"
              value={sourcingAssessment.sellerStrength}
              tone={sourcingAssessment.sellerStrengthTone}
            />
            <ScorePill
              label="Listing Maturity"
              value={sourcingAssessment.listingMaturity}
              tone={sourcingAssessment.listingTone}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-gray-700 bg-gray-950/40 p-4">
            <p className="text-sm font-semibold text-brand-light">Why This Looks {sourcingAssessment.opportunityLabel}</p>
            <ul className="mt-3 text-sm text-gray-300 list-disc list-inside space-y-2">
              {sourcingAssessment.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-gray-700 bg-gray-950/40 p-4">
            <p className="text-sm font-semibold text-brand-light">Missing or Limited Signals</p>
            <ul className="mt-3 text-sm text-gray-300 list-disc list-inside space-y-2">
              {sourcingAssessment.caveats.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {product.bulletHighlights.length > 0 && (
        <div className="mt-6 bg-gray-900/40 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-brand-light mb-3">Seller-Relevant Highlights</h3>
          <div className="flex flex-wrap gap-2">
            {product.bulletHighlights.map((item) => (
              <span
                key={item}
                className="px-3 py-1 text-xs rounded-full border border-brand-cyan/40 text-brand-cyan bg-brand-cyan/10"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {product.variants.length > 0 && (
        <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-brand-light">Variations</h3>
          <div className="space-y-4">
            {product.variants.map((variant) => (
              <div key={`${variant.type}-${variant.label}`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-brand-light">{variant.label}</p>
                  <p className="text-xs text-gray-400">
                    {variant.selected ? `Selected: ${variant.selected}` : 'No option selected in this URL'}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variant.options.map((option) => {
                    const content = (
                      <>
                        {option.imageUrl && (
                          <img
                            src={option.imageUrl.replace('{size}', '200')}
                            alt={option.name}
                            className="h-6 w-6 rounded-full border border-gray-600 object-cover"
                            loading="lazy"
                          />
                        )}
                        <span>{option.name}</span>
                      </>
                    );

                    const className = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      option.isSelected
                        ? 'border-brand-cyan bg-brand-cyan/20 text-brand-light'
                        : option.isEnabled
                          ? 'border-gray-600 bg-gray-800/80 text-gray-300 hover:border-brand-cyan/60'
                          : 'border-gray-700 bg-gray-900 text-gray-500'
                    }`;

                    if (option.productUrl && option.isEnabled) {
                      return (
                        <a
                          key={`${variant.type}-${option.value}`}
                          href={option.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                        >
                          {content}
                        </a>
                      );
                    }

                    return (
                      <span
                        key={`${variant.type}-${option.value}`}
                        className={className}
                      >
                        {content}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.insights.length > 0 && (
        <div className="mt-6 bg-gray-900/40 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-brand-light mb-3">Key Product Information</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {product.insights.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="rounded-md border border-gray-700 bg-gray-950/40 p-3"
              >
                <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
                <p className="text-sm text-gray-200 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <ProductComparisonLinks productName={product.name} expanded />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <OfferCard key={`${offer.kind}-${offer.label}`} offer={offer} />
        ))}
      </div>
    </section>
  );
};

interface OfferCardProps {
  offer: OfferHighlight;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
  const formatPrice = () => {
    if (offer.priceText) {
      return offer.priceText;
    }
    if (offer.currency && typeof offer.price === 'number') {
      return `${offer.currency} ${offer.price.toFixed(2)}`;
    }
    return null;
  };

  const formatListPrice = () => {
    if (offer.listPriceText) {
      return offer.listPriceText;
    }
    if (offer.currency && typeof offer.listPrice === 'number') {
      return `${offer.currency} ${offer.listPrice.toFixed(2)}`;
    }
    return null;
  };

  return (
    <article className="border border-gray-700 rounded-lg p-4 bg-gray-900/40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-brand-cyan/80">{offer.label}</span>
        <span className="text-[10px] text-gray-500">Takealot widget</span>
      </div>
      <p className="text-2xl font-bold text-brand-light">{formatPrice() ?? 'N/A'}</p>
      {offer.listPrice && offer.listPrice !== offer.price && (
        <p className="text-sm text-gray-500 line-through">{formatListPrice()}</p>
      )}
      {offer.deliveryPromise && (
        <p className="mt-3 text-sm text-gray-300">{offer.deliveryPromise}</p>
      )}
      {offer.availabilityStatus && offer.availabilityStatus !== offer.deliveryPromise && (
        <p className="mt-2 text-xs text-gray-400">{offer.availabilityStatus}</p>
      )}
      {offer.sellerName && (
        <p className="mt-3 text-sm text-gray-300">
          Sold by{' '}
          {offer.sellerLink ? (
            <a
              href={offer.sellerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cyan hover:underline"
            >
              {offer.sellerName}
            </a>
          ) : (
            offer.sellerName
          )}
        </p>
      )}
      {(typeof offer.sellerRating === 'number' || typeof offer.sellerReviewCount === 'number') && (
        <p className="mt-2 text-xs text-gray-400">
          Seller signal:{' '}
          {typeof offer.sellerRating === 'number'
            ? `${offer.sellerRating.toFixed(1)} stars`
            : 'No rating'}{' '}
          {typeof offer.sellerReviewCount === 'number'
            ? `from ${offer.sellerReviewCount.toLocaleString('en-ZA')} reviews`
            : ''}
        </p>
      )}
      {offer.locationCodes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {offer.locationCodes.map((code) => (
            <span
              key={code}
              className="px-2 py-0.5 text-xs rounded-full border border-brand-cyan/40 text-brand-cyan"
            >
              {code}
            </span>
          ))}
        </div>
      )}
      {offer.locationDetails.length > 0 && (
        <ul className="mt-3 text-xs text-gray-400 list-disc list-inside space-y-1">
          {offer.locationDetails.map((detail, index) => (
            <li key={`${detail}-${index}`}>{detail}</li>
          ))}
        </ul>
      )}
    </article>
  );
};

export default ProductOfferHighlights;

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

interface ScorePillProps {
  label: string;
  value: string;
  tone: Tone;
}

const ScorePill: React.FC<ScorePillProps> = ({ label, value, tone }) => {
  const toneClass =
    tone === 'good'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : tone === 'warn'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
        : tone === 'bad'
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          : 'border-gray-600 bg-gray-800/70 text-gray-200';

  return (
    <div className={`rounded-md border px-3 py-2 min-w-28 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-sm font-semibold mt-1">{value}</p>
    </div>
  );
};

function buildSourcingAssessment(summary: ProductOfferSummary) {
  const { product, offers } = summary;
  const bestPrice = offers.find((offer) => offer.kind === 'best-price');
  const fastest = offers.find((offer) => offer.kind === 'fastest-delivery');
  const reasons: string[] = [];
  const caveats: string[] = [];
  let score = 50;
  const visibleSellerNames = new Set(
    [product.sellerName, ...offers.map((offer) => offer.sellerName)]
      .map((value) => value?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value))
  );
  const visibleSellerCount = visibleSellerNames.size;

  if (typeof product.starRating === 'number') {
    if (product.starRating >= 4.5) {
      score += 15;
      reasons.push(`Product rating is strong at ${product.starRating.toFixed(1)} stars.`);
    } else if (product.starRating >= 4) {
      score += 8;
      reasons.push(`Product rating is healthy at ${product.starRating.toFixed(1)} stars.`);
    } else if (product.starRating > 0 && product.starRating < 3.8) {
      score -= 12;
      caveats.push(`Product rating is weak at ${product.starRating.toFixed(1)} stars.`);
    }
  } else {
    caveats.push('Product rating is not available.');
  }

  if (typeof product.reviewCount === 'number') {
    if (product.reviewCount >= 100) {
      score += 12;
      reasons.push(`Review volume is proven with ${product.reviewCount.toLocaleString('en-ZA')} reviews.`);
    } else if (product.reviewCount >= 20) {
      score += 6;
      reasons.push(`Review count suggests some traction at ${product.reviewCount.toLocaleString('en-ZA')} reviews.`);
    } else if (product.reviewCount > 0 && product.reviewCount < 10) {
      score -= 4;
      caveats.push(`Review count is still thin at ${product.reviewCount.toLocaleString('en-ZA')} reviews.`);
    } else if (product.reviewCount === 0) {
      caveats.push('No product reviews yet, so demand confidence is limited.');
    }
  }

  const primarySellerReviewCount = Math.max(
    product.sellerReviewCount ?? 0,
    ...offers.map((offer) => offer.sellerReviewCount ?? 0)
  );
  const primarySellerRating = Math.max(
    product.sellerRating ?? 0,
    ...offers.map((offer) => offer.sellerRating ?? 0)
  );

  if (visibleSellerCount <= 1) {
    score += 8;
    reasons.push('Only one visible seller is surfaced on the listing right now.');
  } else if (visibleSellerCount === 2) {
    score += 2;
    reasons.push('Only two visible sellers are surfaced, so competition still looks manageable.');
  } else if (visibleSellerCount >= 4) {
    score -= 8;
    caveats.push(`Multiple sellers are already visible on this listing (${visibleSellerCount} surfaced).`);
  } else if (visibleSellerCount === 3) {
    score -= 3;
    caveats.push('Several sellers are already visible on this listing.');
  } else {
    caveats.push('Visible seller count is unclear from the public Takealot payload.');
  }

  if (primarySellerReviewCount >= 1000) {
    score -= 4;
    caveats.push(
      `The current seller is very established with ${primarySellerReviewCount.toLocaleString('en-ZA')} seller reviews.`
    );
  } else if (primarySellerReviewCount >= 250) {
    score -= 2;
    caveats.push(
      `The current seller appears experienced with ${primarySellerReviewCount.toLocaleString('en-ZA')} seller reviews.`
    );
  } else if (primarySellerReviewCount > 0 && primarySellerReviewCount < 50) {
    score += 4;
    reasons.push('The current seller footprint looks lighter, which may be easier to challenge.');
  }

  if (primarySellerRating >= 4.6) {
    caveats.push(`The current seller quality signal is high at ${primarySellerRating.toFixed(1)} stars.`);
  } else if (primarySellerRating > 0 && primarySellerRating < 4.1) {
    reasons.push(`The current seller quality signal is not dominant at ${primarySellerRating.toFixed(1)} stars.`);
    score += 5;
  }

  if (bestPrice && fastest) {
    const gap = (fastest.price ?? 0) - (bestPrice.price ?? 0);
    if (gap >= 300) {
      reasons.push('There is a meaningful price gap between best-price and fastest-delivery offers.');
      score += 5;
    } else if (gap > 0 && gap <= 100) {
      caveats.push('Price gap between best price and fastest delivery is narrow.');
    }
  } else if (bestPrice && !fastest) {
    reasons.push('Competition view is simpler because there is no separate fastest-delivery offer.');
    score += 4;
  } else if (!bestPrice && fastest) {
    caveats.push('Only fastest-delivery style positioning is visible for this listing.');
  } else {
    caveats.push('Takealot did not expose labeled buybox positions for this product.');
  }

  if (product.bulletHighlights.some((item) => /warranty/i.test(item))) {
    reasons.push('Warranty or return signals are present, which can help conversion.');
  }
  if (product.bulletHighlights.some((item) => /non-returnable/i.test(item))) {
    caveats.push('Non-returnable status may increase buyer hesitation.');
    score -= 4;
  }
  if (product.bulletHighlights.some((item) => /free delivery/i.test(item))) {
    reasons.push('Free-delivery messaging is present on the listing.');
  }

  if (!product.brand) {
    reasons.push('No strong brand signal is visible, which can make sourcing alternatives easier.');
    score += 4;
  } else if (product.brand.length > 0) {
    caveats.push(`Brand is clearly defined as ${product.brand}, so direct sourcing may be more constrained.`);
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const opportunityLabel =
    boundedScore >= 75
      ? 'High Potential'
      : boundedScore >= 60
        ? 'Worth Investigating'
        : boundedScore >= 45
          ? 'Mixed Signals'
          : 'Low Priority';

  const confidence =
    typeof product.reviewCount === 'number' && product.reviewCount >= 20
      ? 'High'
      : typeof product.reviewCount === 'number' && product.reviewCount >= 5
        ? 'Medium'
        : 'Low';

  const marketCompetition =
    visibleSellerCount <= 1
      ? 'Single seller'
      : visibleSellerCount === 2
        ? '2 sellers visible'
        : visibleSellerCount === 3
          ? '3 sellers visible'
          : visibleSellerCount > 3
            ? 'Crowded listing'
            : 'Unclear';

  const sellerStrength =
    primarySellerReviewCount >= 1000
      ? 'Strong incumbent'
      : primarySellerReviewCount >= 250
        ? 'Established seller'
        : primarySellerReviewCount > 0
          ? 'Moderate seller'
          : 'Unclear';

  const listingMaturity =
    typeof product.reviewCount === 'number' && product.reviewCount >= 100
      ? 'Mature'
      : typeof product.reviewCount === 'number' && product.reviewCount >= 10
        ? 'Emerging'
        : 'Early';

  const summaryText =
    opportunityLabel === 'High Potential'
      ? 'This listing shows strong buyer response without looking impossible to challenge. It is a candidate for active sourcing work.'
      : opportunityLabel === 'Worth Investigating'
        ? 'The listing has enough positive demand and offer structure to justify supplier research, but you should still validate competition and landed cost.'
      : opportunityLabel === 'Mixed Signals'
          ? 'There is some useful signal here, but not enough to treat it as a clear winner without more manual validation.'
          : 'This listing does not currently show the combination of demand, weak competition, and strong signals that would make it a top sourcing priority.';

  if (caveats.length === 0) {
    caveats.push('Units sold is not exposed by the public Takealot API, so demand still needs manual validation.');
  } else if (!caveats.some((item) => item.includes('Units sold'))) {
    caveats.push('Units sold is not exposed by the public Takealot API, so demand still needs manual validation.');
  }

  return {
    opportunityScore: boundedScore,
    opportunityLabel,
    summary: summaryText,
    confidence,
    marketCompetition,
    sellerStrength,
    listingMaturity,
    reasons: reasons.slice(0, 6),
    caveats: caveats.slice(0, 6),
    opportunityTone: boundedScore >= 75 ? 'good' : boundedScore >= 60 ? 'warn' : boundedScore >= 45 ? 'neutral' : 'bad',
    confidenceTone: confidence === 'High' ? 'good' : confidence === 'Medium' ? 'warn' : 'neutral',
    marketTone:
      marketCompetition === 'Single seller'
        ? 'good'
        : marketCompetition === '2 sellers visible'
          ? 'warn'
          : marketCompetition === '3 sellers visible'
            ? 'neutral'
            : marketCompetition === 'Crowded listing'
              ? 'bad'
              : 'neutral',
    sellerStrengthTone:
      sellerStrength === 'Strong incumbent'
        ? 'bad'
        : sellerStrength === 'Established seller'
          ? 'warn'
          : sellerStrength === 'Moderate seller'
            ? 'neutral'
            : 'neutral',
    listingTone: listingMaturity === 'Mature' ? 'good' : listingMaturity === 'Emerging' ? 'warn' : 'neutral',
  };
}
