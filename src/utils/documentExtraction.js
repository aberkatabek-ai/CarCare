const {
    normalizeLicensePlate
} = require("./vehicleOwnership");

const documentTypePatterns = [
    {
        type: "registration",
        patterns: [
            /ruhsat/i,
            /registration/i,
            /tescil/i
        ]
    },
    {
        type: "insurance",
        patterns: [
            /sigorta/i,
            /trafik/i,
            /policy/i,
            /police/i
        ]
    },
    {
        type: "casco",
        patterns: [
            /kasko/i,
            /casco/i
        ]
    },
    {
        type: "inspection",
        patterns: [
            /muayene/i,
            /inspection/i,
            /tuvturk/i
        ]
    },
    {
        type: "emission",
        patterns: [
            /emisyon/i,
            /emission/i
        ]
    },
    {
        type: "tax",
        patterns: [
            /vergi/i,
            /tax/i,
            /mtv/i
        ]
    },
    {
        type: "warranty",
        patterns: [
            /garanti/i,
            /warranty/i
        ]
    }
];

const providerPatterns = [
    "allianz",
    "ak sigorta",
    "aksigorta",
    "anadolu sigorta",
    "anadolu",
    "sompo",
    "hdi",
    "mapfre",
    "ray sigorta",
    "zurich",
    "quick sigorta",
    "turkiye sigorta",
    "tuvturk"
];

function normalizeSpaces(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
}

function formatIsoDate(
    year,
    month,
    day
) {
    const normalizedYear = String(year).padStart(
        4,
        "0"
    );
    const normalizedMonth = String(month).padStart(
        2,
        "0"
    );
    const normalizedDay = String(day).padStart(
        2,
        "0"
    );
    const candidate =
        `${normalizedYear}-${normalizedMonth}-${normalizedDay}`;
    const date = new Date(
        `${candidate}T00:00:00Z`
    );

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== candidate
    ) {
        return null;
    }

    return candidate;
}

function extractDateCandidates(text) {
    const candidates = [];
    const patterns = [
        /\b(\d{2})[./-](\d{2})[./-](\d{4})\b/g,
        /\b(\d{4})[./-](\d{2})[./-](\d{2})\b/g
    ];

    patterns.forEach((pattern, patternIndex) => {
        for (const match of text.matchAll(pattern)) {
            const isoDate =
                patternIndex === 0
                    ? formatIsoDate(
                        match[3],
                        match[2],
                        match[1]
                    )
                    : formatIsoDate(
                        match[1],
                        match[2],
                        match[3]
                    );

            if (!isoDate) {
                continue;
            }

            candidates.push({
                isoDate,
                index: match.index || 0
            });
        }
    });

    return candidates;
}

function pickDateNearKeywords(
    text,
    keywords
) {
    const lowerText = text.toLowerCase();
    const dateCandidates =
        extractDateCandidates(text);

    for (const keyword of keywords) {
        const index =
            lowerText.indexOf(keyword);

        if (index === -1) {
            continue;
        }

        const nearby =
            dateCandidates.find(
                (candidate) =>
                    Math.abs(
                        candidate.index - index
                    ) <= 40
            );

        if (nearby) {
            return nearby.isoDate;
        }
    }

    return null;
}

function inferDocumentType({
    ocrText,
    fileName,
    fallbackType
}) {
    if (fallbackType) {
        return fallbackType;
    }

    const haystack = `${ocrText}\n${fileName}`;

    for (const documentTypePattern of documentTypePatterns) {
        if (
            documentTypePattern.patterns.some(
                (pattern) =>
                    pattern.test(haystack)
            )
        ) {
            return documentTypePattern.type;
        }
    }

    return null;
}

function inferProvider(text, fileName) {
    const haystack =
        `${text}\n${fileName}`.toLowerCase();

    for (const providerName of providerPatterns) {
        if (haystack.includes(providerName)) {
            return providerName
                .split(" ")
                .map(
                    (part) =>
                        part.charAt(0).toUpperCase() +
                        part.slice(1)
                )
                .join(" ");
        }
    }

    const providerMatch = text.match(
        /(?:sigortaci|sigorta şirketi|insurance company|provider)[:\s]+([A-Za-zÇĞİÖŞÜçğıöşü\s.-]{3,60})/i
    );

    return providerMatch
        ? normalizeSpaces(providerMatch[1])
        : null;
}

function inferDocumentNumber(text) {
    const labelledMatch = text.match(
        /(?:poli[çc]e no|police no|policy no|belge no|document no|seri no|serial no|ruhsat no)[:\s#-]*([A-Z0-9-]{5,30})/i
    );

    if (labelledMatch) {
        return labelledMatch[1];
    }

    const genericMatch = text.match(
        /\b[A-Z0-9]{3,6}-[A-Z0-9-]{4,20}\b/
    );

    return genericMatch
        ? genericMatch[0]
        : null;
}

function inferLicensePlate(text) {
    const plateMatch = text.match(
        /\b\d{2}\s?[A-Z]{1,3}\s?\d{2,4}\b/i
    );

    if (!plateMatch) {
        return null;
    }

    return normalizeLicensePlate(
        plateMatch[0]
    ).displayValue;
}

function inferDates(text) {
    const startDate = pickDateNearKeywords(text, [
        "başlang",
        "valid from",
        "issue date",
        "düzenleme"
    ]);
    const expiryDate =
        pickDateNearKeywords(text, [
            "bitiş",
            "sona er",
            "expiry",
            "valid until",
            "geçerlilik"
        ]);

    if (startDate || expiryDate) {
        return {
            startDate,
            expiryDate
        };
    }

    const allDates =
        extractDateCandidates(text)
            .map((candidate) => candidate.isoDate)
            .sort();

    return {
        startDate:
            allDates.length >= 2
                ? allDates[0]
                : null,
        expiryDate:
            allDates.length >= 1
                ? allDates[allDates.length - 1]
                : null
    };
}

function buildTitle(documentType, provider) {
    const titleMap = {
        registration:
            "Vehicle registration",
        inspection:
            "Vehicle inspection",
        insurance:
            "Traffic insurance",
        casco:
            "Comprehensive insurance",
        emission:
            "Emission inspection",
        tax: "Vehicle tax",
        warranty: "Warranty",
        other: "Vehicle document"
    };

    if (!documentType) {
        return null;
    }

    return provider
        ? `${titleMap[documentType]} - ${provider}`
        : titleMap[documentType];
}

function extractDocumentSuggestions({
    ocrText,
    fileName,
    documentType
}) {
    const normalizedText =
        normalizeSpaces(ocrText);
    const inferredType =
        inferDocumentType({
            ocrText: normalizedText,
            fileName,
            fallbackType: documentType
        });
    const provider = inferProvider(
        normalizedText,
        fileName
    );
    const documentNumber =
        inferDocumentNumber(normalizedText);
    const licensePlate =
        inferLicensePlate(normalizedText);
    const {
        startDate,
        expiryDate
    } = inferDates(normalizedText);
    const title = buildTitle(
        inferredType,
        provider
    );

    const suggestions = {
        documentType: inferredType,
        title,
        provider,
        documentNumber,
        startDate,
        expiryDate,
        licensePlate
    };

    const detectedFieldCount = Object.values(
        suggestions
    ).filter(Boolean).length;

    return {
        suggestions,
        detectedFieldCount,
        previewText: normalizedText.slice(
            0,
            280
        )
    };
}

module.exports = {
    extractDocumentSuggestions
};
