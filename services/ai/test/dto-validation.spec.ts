import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AcceptRecommendationDto } from '../src/recommendations/dto/accept-recommendation.dto';
import { GenerateTaskSuggestionsDto } from '../src/recommendations/dto/generate-task-suggestions.dto';

describe('GenerateTaskSuggestionsDto validation', () => {
  it('accepts an empty payload (maxSuggestions defaults)', async () => {
    const dto = plainToInstance(GenerateTaskSuggestionsDto, {});
    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts a maxSuggestions within range', async () => {
    const dto = plainToInstance(GenerateTaskSuggestionsDto, { maxSuggestions: 8 });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a maxSuggestions above the cap', async () => {
    const dto = plainToInstance(GenerateTaskSuggestionsDto, { maxSuggestions: 50 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'maxSuggestions')).toBe(true);
  });

  it('rejects a non-integer maxSuggestions', async () => {
    const dto = plainToInstance(GenerateTaskSuggestionsDto, { maxSuggestions: 2.5 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'maxSuggestions')).toBe(true);
  });
});

describe('AcceptRecommendationDto validation', () => {
  it('accepts a well-formed index list', async () => {
    const dto = plainToInstance(AcceptRecommendationDto, { acceptedIndices: [0, 2] });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an empty index list', async () => {
    const dto = plainToInstance(AcceptRecommendationDto, { acceptedIndices: [] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'acceptedIndices')).toBe(true);
  });

  it('rejects a negative index', async () => {
    const dto = plainToInstance(AcceptRecommendationDto, { acceptedIndices: [-1] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'acceptedIndices')).toBe(true);
  });

  it('rejects duplicate indices', async () => {
    const dto = plainToInstance(AcceptRecommendationDto, { acceptedIndices: [0, 0] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'acceptedIndices')).toBe(true);
  });

  it('rejects a non-integer index', async () => {
    const dto = plainToInstance(AcceptRecommendationDto, { acceptedIndices: [1.5] });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'acceptedIndices')).toBe(true);
  });
});
