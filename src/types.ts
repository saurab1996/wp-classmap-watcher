export interface DirectoryConfig {
    includesDir: string;
    outputFile:  string;
    exclude?:    string[];
}

export interface ClassInfo {
    namespace: string;
    className: string;
}

export interface ClassMap {
    [fullClass: string]: string; // 'Ns\\Class' => 'relative/path.php'
}

export interface GenerateResult {
    includesDir: string;
    count:       number;
    outputPath:  string;
    warnings:    Warning[];
    error?:      string;
}

export interface Warning {
    type:    'duplicate_class' | 'multiple_classes_in_file';
    message: string;
    file:    string;
}